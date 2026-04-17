import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
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

    return 'skip'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const extensionsPath = resolvePath(cwd, '.vscode', 'extensions.json')
    const exists = await fileExists(extensionsPath)
    const before = exists ? await readFile(extensionsPath) : null
    const after = renderVscodeExtensions(profile)

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
