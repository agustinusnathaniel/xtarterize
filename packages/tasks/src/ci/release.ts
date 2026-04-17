import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
import { renderReleaseWorkflow } from '../templates/workflows/release-yml.js'

export const releaseWorkflowTask: Task = {
  id: 'ci/release',
  label: 'GitHub release workflow',
  group: 'CI/CD',
  applicable: (profile) => profile.hasGitHub,

  async check(cwd, profile): Promise<TaskStatus> {
    const workflowPath = resolvePath(cwd, '.github', 'workflows', 'release.yml')
    const exists = await fileExists(workflowPath)
    if (!exists) return 'new'

    const expected = renderReleaseWorkflow(profile)
    const actual = await readFile(workflowPath)
    if (actual.trim() === expected.trim()) return 'skip'

    return 'conflict'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const workflowPath = resolvePath(cwd, '.github', 'workflows', 'release.yml')
    const exists = await fileExists(workflowPath)
    const before = exists ? await readFile(workflowPath) : null
    const after = renderReleaseWorkflow(profile)

    return [{ filepath: '.github/workflows/release.yml', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
