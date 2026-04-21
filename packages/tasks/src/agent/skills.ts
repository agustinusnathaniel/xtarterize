import { createSimpleFileTask } from '../factory.js'
import { renderProjectContext } from '../templates/project-context.js'

export const skillsTask = createSimpleFileTask({
	id: 'agent/skills',
	label: 'AI Skills directory',
	group: 'Agent',
	applicable: (profile) => profile.typescript,
	filepath: '.agents/skills/project-context.md',
	render: (profile) => renderProjectContext(profile),
	ensureParentDir: true,
	checkFn: async (cwd, _profile, _fullPath, content) => {
		if (!content) return 'new'
		return 'skip'
	},
})
