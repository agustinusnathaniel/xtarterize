import { createSimpleFileTask } from '../factory.js'
import { renderAgentsMd } from '../templates/agents-md.js'

export const agentsMdTask = createSimpleFileTask({
	id: 'agent/agents-md',
	label: 'AGENTS.md',
	group: 'Agent',
	applicable: () => true,
	filepath: 'AGENTS.md',
	render: (profile) => renderAgentsMd(profile),
})
