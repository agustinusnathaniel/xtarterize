import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readPackageJson,
	resolvePath,
} from '@xtarterize/core'
import { injectVitePlugin } from '@xtarterize/patchers'
import { generateCode, loadFile } from 'magicast'
import { addDependency } from 'nypm'

export const viteVisualizerTask: Task = {
	id: 'vite/visualizer',
	label: 'rollup-plugin-visualizer',
	group: 'Vite Plugins',
	applicable: (profile) => profile.bundler === 'vite',

	async check(cwd, _profile): Promise<TaskStatus> {
		const configPath = resolvePath(cwd, 'vite.config.ts')
		const exists = await fileExists(configPath)
		if (!exists) return 'conflict'

		const content = await readFile(configPath)
		if (content.includes('rollup-plugin-visualizer')) return 'skip'

		return 'new'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const configPath = resolvePath(cwd, 'vite.config.ts')
		const before = await readFile(configPath)

		const mod = await loadFile(configPath)
		const code = mod.$code

		if (code.includes('rollup-plugin-visualizer')) {
			return [{ filepath: 'vite.config.ts', before, after: before }]
		}

		const defaultExport = mod.exports.default
		if (!defaultExport || !Array.isArray(defaultExport.plugins)) {
			return [{ filepath: 'vite.config.ts', before, after: before }]
		}

		const plugins: any[] = defaultExport.plugins
		plugins.push('visualizer({ open: false, gzipSize: true })')

		const { code: after } = generateCode(mod)
		const finalAfter = `import { visualizer } from 'rollup-plugin-visualizer'\n${after}`

		return [{ filepath: 'vite.config.ts', before, after: finalAfter }]
	},

	async apply(cwd, _profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg?.devDependencies?.['rollup-plugin-visualizer']) {
			await addDependency(['rollup-plugin-visualizer'], { cwd, dev: true })
		}

		const configPath = resolvePath(cwd, 'vite.config.ts')
		const result = await injectVitePlugin(
			configPath,
			'rollup-plugin-visualizer',
			'{ visualizer }',
			'visualizer({ open: false, gzipSize: true })',
		)

		if (!result.success) {
			throw new Error(
				result.fallback ?? 'Failed to inject rollup-plugin-visualizer',
			)
		}
	},
}
