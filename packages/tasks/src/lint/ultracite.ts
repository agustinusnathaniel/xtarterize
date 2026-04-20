import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	findConfigFile,
	readFile,
	readPackageJson,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { mergeJson, parseJsonc } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

const BIOME_EXTENSIONS = ['.json', '.jsonc']

async function findBiomeConfigPath(cwd: string): Promise<{ path: string | null; isJsonc: boolean }> {
	const found = await findConfigFile(cwd, 'biome', BIOME_EXTENSIONS)
	if (!found) return { path: null, isJsonc: false }
	return { path: found, isJsonc: found.endsWith('.jsonc') }
}

function addUltraciteExtends(existing: Record<string, unknown>): Record<string, unknown> {
	const extendsList = existing.extends as string[] | undefined
	if (extendsList?.includes('ultracite') || extendsList?.some((e) => e.startsWith('ultracite/'))) {
		return existing
	}
	return { ...existing, extends: [...(extendsList ?? []), 'ultracite'] }
}

export const ultraciteTask: Task = {
	id: 'lint/ultracite',
	label: 'Ultracite preset',
	group: 'Linting & Formatting',
	applicable: () => true,

	async check(cwd, _profile): Promise<TaskStatus> {
		const { path: biomePath } = await findBiomeConfigPath(cwd)
		if (!biomePath) return 'conflict'

		const content = await readFile(biomePath)
		const parsed = parseJsonc(content) as Record<string, unknown>
		const extendsList = parsed.extends as string[] | undefined
		if (
			extendsList?.includes('ultracite') ||
			extendsList?.some((e) => e.startsWith('ultracite/'))
		) {
			const pkg = await readPackageJson(cwd)
			if (pkg?.devDependencies?.ultracite) return 'skip'
		}

		return 'patch'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const { path: biomePath, isJsonc } = await findBiomeConfigPath(cwd)
		const before = biomePath ? await readFile(biomePath) : null

		const existing = before
			? (parseJsonc(before) as Record<string, unknown>)
			: {}
		const merged = mergeJson(existing, { extends: ['ultracite'] })
		const after = JSON.stringify(merged, null, 2)

		const filepath = isJsonc ? 'biome.jsonc' : 'biome.json'
		return [{ filepath, before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg?.devDependencies?.ultracite) {
			await addDependency(['ultracite'], { cwd, dev: true })
		}

		const diffs = await this.dryRun(cwd, profile)
		for (const diff of diffs) {
			const fullPath = resolvePath(cwd, diff.filepath)
			await writeFile(fullPath, diff.after)
		}
	},
}
