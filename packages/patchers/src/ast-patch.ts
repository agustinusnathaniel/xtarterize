import { writeFile } from 'node:fs/promises'
import { generateCode, loadFile } from 'magicast'

const CONFIG_FILE_NAMES: Record<string, string> = {
	'vite.config.ts': 'vite.config',
	'vite.config.js': 'vite.config',
	'vite.config.mts': 'vite.config',
	'vite.config.cjs': 'vite.config',
}

function getConfigLabel(configPath: string): string {
	const basename = configPath.split('/').pop() || 'config'
	return CONFIG_FILE_NAMES[basename] || basename
}

export async function injectVitePlugin(
	configPath: string,
	importPath: string,
	importName: string,
	pluginExpression: string,
): Promise<{ success: boolean; fallback?: string }> {
	const configLabel = getConfigLabel(configPath)

	try {
		const mod = await loadFile(configPath)
		const code = mod.$code

		if (code.includes(importPath) || code.includes(importName)) {
			return { success: true }
		}

		const defaultExport = mod.exports.default
		if (!defaultExport) {
			return {
				success: false,
				fallback: `No default export found in ${configLabel}`,
			}
		}

		let plugins: any[] | undefined

		if (Array.isArray(defaultExport.plugins)) {
			plugins = defaultExport.plugins
		} else if (typeof defaultExport === 'function') {
			return {
				success: false,
				fallback: 'Function-style vite config not supported by AST patching',
			}
		} else {
			return {
				success: false,
				fallback: `Unsupported ${configLabel} structure. Manually add the plugin.`,
			}
		}

		if (!plugins) {
			return {
				success: false,
				fallback: `Could not locate plugins array in ${configLabel}`,
			}
		}

		mod.imports.$add({
			from: importPath,
			imported: importName === '{ visualizer }' ? 'visualizer' : 'default',
			local: importName === '{ visualizer }' ? 'visualizer' : importName,
		})

		plugins.push(pluginExpression)

		const { code: generatedCode } = generateCode(mod)
		await writeFile(configPath, generatedCode)

		return { success: true }
	} catch (error) {
		return {
			success: false,
			fallback: `AST patching failed: ${error instanceof Error ? error.message : 'Unknown error'}. Add plugin manually to ${configLabel}.`,
		}
	}
}
