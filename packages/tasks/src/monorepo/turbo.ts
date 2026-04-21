import { readPackageJson } from '@xtarterize/core'
import { createJsonMergeTask } from '../factory.js'

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

export const turboTask = createJsonMergeTask({
	id: 'monorepo/turbo',
	label: 'Turbo (monorepo build)',
	group: 'Monorepo',
	applicable: (profile) => profile.monorepo,
	filepath: 'turbo.json',
	depName: 'turbo',
	installDev: true,
	incoming: async (cwd) => {
		const pkg = await readPackageJson(cwd)
		const scripts = Object.keys(pkg?.scripts ?? {})
		return buildTurboJson(scripts)
	},
})
