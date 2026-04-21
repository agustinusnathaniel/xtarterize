import { createFileTask } from '@/factory.js'
import { renderAgentsMd } from '@/templates/agents-md.js'

export const agentsMdTask = createFileTask({
	id: 'agent/agents-md',
	label: 'AGENTS.md',
	group: 'Agent',
	applicable: () => true,
	filepath: 'AGENTS.md',
	render: (profile) => renderAgentsMd(profile),
	checkFn: async (_cwd, _profile, fullPath, content) => {
		if (fullPath && content) return 'skip'
		return 'new'
	},
})
