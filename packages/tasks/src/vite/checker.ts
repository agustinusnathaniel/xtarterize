import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	findConfigFile,
	readFile,
	readPackageJson,
} from '@xtarterize/core'
import { injectVitePlugin } from '@xtarterize/patchers'
import { generateCode, loadFile } from 'magicast'
import { addDependency } from 'nypm'

const VITE_CONFIG_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs', '.cjs', '.cts']

async function findViteConfig(cwd: string): Promise<string | null> {
	return findConfigFile(cwd, 'vite.config', VITE_CONFIG_EXTENSIONS)
}

export const viteCheckerTask: Task = {
	id: 'vite/checker',
	label: 'vite-plugin-checker',
	group: 'Vite Plugins',
	applicable: (profile) => profile.bundler === 'vite',

	async check(cwd, _profile): Promise<TaskStatus> {
		const configPath = await findViteConfig(cwd)
		if (!configPath) return 'conflict'

		const content = await readFile(configPath)
		if (content.includes('vite-plugin-checker')) return 'skip'

		return 'new'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const configPath = await findViteConfig(cwd)
		if (!configPath) return []

		const before = await readFile(configPath)

		const mod = await loadFile(configPath)
		const code = mod.$code

		if (code.includes('vite-plugin-checker')) {
			return [{ filepath: 'vite.config', before, after: before }]
		}

		const defaultExport = mod.exports.default
		if (!defaultExport || !Array.isArray(defaultExport.plugins)) {
			return [{ filepath: 'vite.config', before, after: before }]
		}

		const plugins: any[] = defaultExport.plugins
		plugins.push('checker({ typescript: true })')

		const { code: after } = generateCode(mod)
		const finalAfter = `import checker from 'vite-plugin-checker'\n${after}`

		return [{ filepath: 'vite.config', before, after: finalAfter }]
	},

	async apply(cwd, _profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg?.devDependencies?.['vite-plugin-checker']) {
			await addDependency(['vite-plugin-checker'], { cwd, dev: true })
		}

		const configPath = await findViteConfig(cwd)
		if (!configPath) {
			throw new Error('No vite.config file found')
		}

		const result = await injectVitePlugin(
			configPath,
			'vite-plugin-checker',
			'checker',
			'checker({ typescript: true })',
		)

		if (!result.success) {
			throw new Error(result.fallback ?? 'Failed to inject vite-plugin-checker')
		}
	},
}
