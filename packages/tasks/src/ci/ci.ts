import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
import { renderCiWorkflow } from '../templates/workflows/ci-yml.js'

export const ciWorkflowTask: Task = {
  id: 'ci/ci',
  label: 'GitHub CI workflow',
  group: 'CI/CD',
  applicable: (profile) => profile.hasGitHub,

  async check(cwd, profile): Promise<TaskStatus> {
    const workflowPath = resolvePath(cwd, '.github', 'workflows', 'ci.yml')
    const exists = await fileExists(workflowPath)
    if (!exists) return 'new'

    return 'skip'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const workflowPath = resolvePath(cwd, '.github', 'workflows', 'ci.yml')
    const exists = await fileExists(workflowPath)
    const before = exists ? await readFile(workflowPath) : null
    const after = renderCiWorkflow(profile)

    return [{ filepath: '.github/workflows/ci.yml', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
