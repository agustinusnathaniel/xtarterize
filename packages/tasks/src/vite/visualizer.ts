import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson } from '@xtarterize/core'
import { injectVitePlugin } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

export const viteVisualizerTask: Task = {
  id: 'vite/visualizer',
  label: 'rollup-plugin-visualizer',
  group: 'Vite Plugins',
  applicable: (profile) => profile.bundler === 'vite',

  async check(cwd, profile): Promise<TaskStatus> {
    const configPath = resolvePath(cwd, 'vite.config.ts')
    const exists = await fileExists(configPath)
    if (!exists) return 'conflict'

    const content = await readFile(configPath)
    if (content.includes('rollup-plugin-visualizer')) return 'skip'

    return 'new'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const configPath = resolvePath(cwd, 'vite.config.ts')
    const before = await readFile(configPath)

    const after = before
      .replace(
        /^(import.*from.*['"]vite['"])/m,
        `import { visualizer } from 'rollup-plugin-visualizer'\n$1`
      )
      .replace(
        /plugins:\s*\[/,
        `plugins: [\n      visualizer({ open: false, gzipSize: true }),`
      )

    return [{ filepath: 'vite.config.ts', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['rollup-plugin-visualizer']) {
      await addDependency(['rollup-plugin-visualizer'], { cwd, dev: true })
    }

    const configPath = resolvePath(cwd, 'vite.config.ts')
    const result = await injectVitePlugin(
      configPath,
      "import { visualizer } from 'rollup-plugin-visualizer'",
      "visualizer({ open: false, gzipSize: true })",
      'rollup-plugin-visualizer'
    )

    if (!result.success) {
      const before = await readFile(configPath)
      const after = before
        .replace(/^(import.*from.*['"]vite['"].*)/m, "import { visualizer } from 'rollup-plugin-visualizer'\n$1")
        .replace(/plugins:\s*\[/, 'plugins: [\n      visualizer({ open: false, gzipSize: true }),')
      await writeFile(configPath, after)
    }
  }
}
