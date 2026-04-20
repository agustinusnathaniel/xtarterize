import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readJsonIfExists,
	readPackageJson,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

interface TurboTaskConfig {
	dependsOn?: string[]
	outputs?: string[]
	cache?: boolean
	persistent?: boolean
	inputs?: string[]
}

interface TurboJsonTemplate {
	$schema: string
	tasks: Record<string, TurboTaskConfig>
}

const TURBO_TASKS: Record<string, TurboTaskConfig> = {
	build: { dependsOn: ['^build'], outputs: ['dist/**'] },
	lint: { dependsOn: ['^lint'] },
	typecheck: { dependsOn: ['^typecheck'] },
	dev: { cache: false, persistent: true },
	test: { dependsOn: ['^build'] },
}

function buildTurboJson(scripts: string[]): TurboJsonTemplate {
	const tasks: Record<string, TurboTaskConfig> = {}

	for (const [taskName, config] of Object.entries(TURBO_TASKS)) {
		if (scripts.includes(taskName)) {
			tasks[taskName] = config
		}
	}

	return {
		$schema: 'https://turbo.build/schema.json',
		tasks,
	}
}

function getProjectScripts(pkg: Record<string, unknown>): string[] {
	const scripts = (pkg.scripts as Record<string, string>) ?? {}
	return Object.keys(scripts)
}

export const turboTask: Task = {
	id: 'monorepo/turbo',
	label: 'Turbo (monorepo build)',
	group: 'Monorepo',
	applicable: (profile) => profile.monorepo,

	async check(cwd, _profile): Promise<TaskStatus> {
		const turboPath = resolvePath(cwd, 'turbo.json')
		const exists = await fileExists(turboPath)

		const pkg = await readPackageJson(cwd)
		const hasTurbo = pkg?.devDependencies?.turbo
		if (!hasTurbo) return 'patch'

		if (!exists) return 'new'

		const scripts = getProjectScripts(pkg ?? {})
		const expected = buildTurboJson(scripts)
		const actual = await readJsonIfExists(turboPath)
		const merged = mergeJson(actual ?? {}, expected)
		if (JSON.stringify(actual) === JSON.stringify(merged)) return 'skip'

		return 'patch'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const turboPath = resolvePath(cwd, 'turbo.json')
		const exists = await fileExists(turboPath)
		const before = exists ? await readFile(turboPath) : null

		const pkg = await readPackageJson(cwd)
		const scripts = getProjectScripts(pkg ?? {})
		const expected = buildTurboJson(scripts)

		let after: string
		if (exists && before) {
			const actual = JSON.parse(before)
			after = JSON.stringify(mergeJson(actual, expected), null, 2)
		} else {
			after = JSON.stringify(expected, null, 2)
		}

		return [{ filepath: 'turbo.json', before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return

		const scripts = getProjectScripts(pkg)
		const expected = buildTurboJson(scripts)

		const turboPath = resolvePath(cwd, 'turbo.json')
		const exists = await fileExists(turboPath)

		let final: object
		if (exists) {
			const actual = await readJsonIfExists(turboPath)
			final = mergeJson(actual ?? {}, expected)
		} else {
			final = expected
		}

		await writeFile(turboPath, JSON.stringify(final, null, 2))

		if (!pkg?.devDependencies?.turbo) {
			await addDependency(['turbo'], { cwd, dev: true })
		}
	},
}
