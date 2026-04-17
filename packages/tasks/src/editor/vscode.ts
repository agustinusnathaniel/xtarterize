import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readJsonIfExists } from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
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

    const existing = await readJsonIfExists(settingsPath)
    const incoming = JSON.parse(renderVscodeSettings(profile))
    const merged = mergeJson(existing ?? {}, incoming)
    const mergedStr = JSON.stringify(merged, null, 2)
    const actual = await readFile(settingsPath)
    if (actual.trim() === mergedStr.trim()) return 'skip'

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const settingsPath = resolvePath(cwd, '.vscode', 'settings.json')
    const exists = await fileExists(settingsPath)
    const before = exists ? await readFile(settingsPath) : null

    let after: string
    if (exists && before) {
      const existing = JSON.parse(before)
      const incoming = JSON.parse(renderVscodeSettings(profile))
      after = JSON.stringify(mergeJson(existing, incoming), null, 2)
    } else {
      after = renderVscodeSettings(profile)
    }

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
