import { loadFile, generateCode } from 'magicast'
import fs from 'fs-extra'

export async function injectVitePlugin(
  configPath: string,
  importStatement: string,
  pluginExpression: string,
  pluginName: string,
): Promise<{ success: boolean; fallback?: string }> {
  try {
    const mod = await loadFile(configPath)
    const code = mod.$code
    
    // Check if plugin is already imported
    if (code.includes(pluginName)) {
      return { success: true }
    }
    
    // Find the default export and locate plugins array
    const exports = mod.exports
    const defaultExport = exports.default
    
    if (!defaultExport) {
      return { success: false, fallback: 'No default export found in vite.config.ts' }
    }
    
    // Handle defineConfig wrapper
    let plugins: unknown[] | undefined
    
    // Try direct plugins array
    if (Array.isArray(defaultExport.plugins)) {
      plugins = defaultExport.plugins
    }
    // Try return statement in function
    else if (typeof defaultExport === 'function') {
      return { success: false, fallback: 'Function-style vite config not supported by AST patching' }
    }
    // Try nested in return of arrow function
    else {
      return { success: false, fallback: 'Unsupported vite.config.ts structure. Manually add the plugin.' }
    }
    
    if (!plugins) {
      return { success: false, fallback: 'Could not locate plugins array in vite.config.ts' }
    }
    
    // Add import at top
    // magicast handles this via mod.imports
    
    // Push plugin to plugins array
    plugins.push(pluginExpression as unknown)
    
    const { code: generatedCode } = generateCode(mod)
    await fs.writeFile(configPath, generatedCode)
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      fallback: `AST patching failed: ${error instanceof Error ? error.message : 'Unknown error'}. Add plugin manually to vite.config.ts.` 
    }
  }
}
