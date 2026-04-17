import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson } from '@xtarterize/core'
import { injectVitePlugin } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

export const viteCheckerTask: Task = {
  id: 'vite/checker',
  label: 'vite-plugin-checker',
  group: 'Vite Plugins',
  applicable: (profile) => profile.bundler === 'vite',

  async check(cwd, profile): Promise<TaskStatus> {
    const configPath = resolvePath(cwd, 'vite.config.ts')
    const exists = await fileExists(configPath)
    if (!exists) return 'conflict'

    const content = await readFile(configPath)
    if (content.includes('vite-plugin-checker')) return 'skip'

    return 'new'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const configPath = resolvePath(cwd, 'vite.config.ts')
    const before = await readFile(configPath)

    const after = before
      .replace(
        /^(import.*from.*['"]vite['"])/m,
        `import checker from 'vite-plugin-checker'\n$1`
      )
      .replace(
        /plugins:\s*\[/,
        `plugins: [\n      checker({ typescript: true }),`
      )

    return [{ filepath: 'vite.config.ts', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['vite-plugin-checker']) {
      await addDependency(['vite-plugin-checker'], { cwd, dev: true })
    }

    const configPath = resolvePath(cwd, 'vite.config.ts')
    const result = await injectVitePlugin(
      configPath,
      "import checker from 'vite-plugin-checker'",
      "checker({ typescript: true })",
      'vite-plugin-checker'
    )

    if (!result.success) {
      const before = await readFile(configPath)
      const after = before
        .replace(/^(import.*from.*['"]vite['"].*)/m, "import checker from 'vite-plugin-checker'\n$1")
        .replace(/plugins:\s*\[/, 'plugins: [\n      checker({ typescript: true }),')
      await writeFile(configPath, after)
    }
  }
}
