import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
import { renderRenovateJson } from '../templates/renovate-json.js'

export const renovateTask: Task = {
  id: 'deps/renovate',
  label: 'Renovate config',
  group: 'Dependencies',
  applicable: (profile) => profile.hasGitHub,

  async check(cwd, profile): Promise<TaskStatus> {
    const renovatePath = resolvePath(cwd, 'renovate.json')
    const exists = await fileExists(renovatePath)
    if (!exists) return 'new'

    const expected = renderRenovateJson(profile)
    const actual = await readFile(renovatePath)
    if (actual.trim() === expected.trim()) return 'skip'

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const renovatePath = resolvePath(cwd, 'renovate.json')
    const exists = await fileExists(renovatePath)
    const before = exists ? await readFile(renovatePath) : null
    const after = renderRenovateJson(profile)

    return [{ filepath: 'renovate.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
