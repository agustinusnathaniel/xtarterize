import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
import { renderAutoUpdateWorkflow } from '../templates/workflows/auto-update-yml.js'

export const autoUpdateWorkflowTask: Task = {
  id: 'ci/auto-update',
  label: 'GitHub auto-update workflow',
  group: 'CI/CD',
  applicable: (profile) => profile.hasGitHub,

  async check(cwd, profile): Promise<TaskStatus> {
    const workflowPath = resolvePath(cwd, '.github', 'workflows', 'auto-update.yml')
    const exists = await fileExists(workflowPath)
    if (!exists) return 'new'

    const expected = renderAutoUpdateWorkflow(profile)
    const actual = await readFile(workflowPath)
    if (actual.trim() === expected.trim()) return 'skip'

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const workflowPath = resolvePath(cwd, '.github', 'workflows', 'auto-update.yml')
    const exists = await fileExists(workflowPath)
    const before = exists ? await readFile(workflowPath) : null
    const after = renderAutoUpdateWorkflow(profile)

    return [{ filepath: '.github/workflows/auto-update.yml', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
