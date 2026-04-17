import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
import { renderVscodeSettings } from '../templates/vscode/settings.js'

export const vscodeTask: Task = {
  id: 'editor/vscode',
  label: 'VSCode settings',
  group: 'Editor',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const settingsPath = resolvePath(cwd, '.vscode', 'settings.json')
    const exists = await fileExists(settingsPath)
    if (!exists) return 'new'

    return 'skip'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const settingsPath = resolvePath(cwd, '.vscode', 'settings.json')
    const exists = await fileExists(settingsPath)
    const before = exists ? await readFile(settingsPath) : null
    const after = renderVscodeSettings()

    return [{ filepath: '.vscode/settings.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
