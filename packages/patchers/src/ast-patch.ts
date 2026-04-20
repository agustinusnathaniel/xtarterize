import { writeFile } from 'node:fs/promises'
import { generateCode, loadFile } from 'magicast'

export async function injectVitePlugin(
	configPath: string,
	importPath: string,
	importName: string,
	pluginExpression: string,
): Promise<{ success: boolean; fallback?: string }> {
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
				fallback: 'No default export found in vite.config.ts',
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
				fallback:
					'Unsupported vite.config.ts structure. Manually add the plugin.',
			}
		}

		if (!plugins) {
			return {
				success: false,
				fallback: 'Could not locate plugins array in vite.config.ts',
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
			fallback: `AST patching failed: ${error instanceof Error ? error.message : 'Unknown error'}. Add plugin manually to vite.config.ts.`,
		}
	}
}
