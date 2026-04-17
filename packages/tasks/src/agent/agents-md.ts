import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath } from '@xtarterize/core'
import { renderAgentsMd } from '../templates/agents-md.js'

export const agentsMdTask: Task = {
  id: 'agent/agents-md',
  label: 'AGENTS.md',
  group: 'Agent',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const agentsPath = resolvePath(cwd, 'AGENTS.md')
    const exists = await fileExists(agentsPath)
    if (!exists) return 'new'

    return 'skip'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const agentsPath = resolvePath(cwd, 'AGENTS.md')
    const exists = await fileExists(agentsPath)
    const before = exists ? await readFile(agentsPath) : null
    const after = renderAgentsMd(profile)

    return [{ filepath: 'AGENTS.md', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
