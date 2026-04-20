import type { ProjectProfile, Task, TaskStatus, FileDiff } from '@xtarterize/core'
import {
	fileExists,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { renderAgentsMd } from '../templates/agents-md.js'

export const agentsMdTask: Task = {
	id: 'agent/agents-md',
	label: 'AGENTS.md',
	group: 'Agent',
	applicable: () => true,

	async check(cwd, _profile): Promise<TaskStatus> {
		const fullPath = resolvePath(cwd, 'AGENTS.md')
		const exists = await fileExists(fullPath)
		// Skip if AGENTS.md already exists — it's a human-authored document
		if (exists) return 'skip'
		return 'new'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const fullPath = resolvePath(cwd, 'AGENTS.md')
		const exists = await fileExists(fullPath)
		if (exists) return []
		const after = renderAgentsMd(profile)
		return [{ filepath: 'AGENTS.md', before: null, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const fullPath = resolvePath(cwd, 'AGENTS.md')
		const exists = await fileExists(fullPath)
		if (exists) return
		await writeFile(fullPath, renderAgentsMd(profile))
	},
}
