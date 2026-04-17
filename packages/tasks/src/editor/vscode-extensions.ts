import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readJsonIfExists } from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
import { renderVscodeExtensions } from '../templates/vscode/extensions.js'

export const vscodeExtensionsTask: Task = {
  id: 'editor/vscode-extensions',
  label: 'VSCode extensions',
  group: 'Editor',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const extensionsPath = resolvePath(cwd, '.vscode', 'extensions.json')
    const exists = await fileExists(extensionsPath)
    if (!exists) return 'new'

    const existing = await readJsonIfExists(extensionsPath)
    const incoming = JSON.parse(renderVscodeExtensions(profile))
    const merged = mergeJson(existing ?? {}, incoming)
    const mergedStr = JSON.stringify(merged, null, 2)
    const actual = await readFile(extensionsPath)
    if (actual.trim() === mergedStr.trim()) return 'skip'

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const extensionsPath = resolvePath(cwd, '.vscode', 'extensions.json')
    const exists = await fileExists(extensionsPath)
    const before = exists ? await readFile(extensionsPath) : null

    let after: string
    if (exists && before) {
      const existing = JSON.parse(before)
      const incoming = JSON.parse(renderVscodeExtensions(profile))
      after = JSON.stringify(mergeJson(existing, incoming), null, 2)
    } else {
      after = renderVscodeExtensions(profile)
    }

    return [{ filepath: '.vscode/extensions.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
