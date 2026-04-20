import { createSimpleFileTask } from '../factory.js'
import { renderRenovateJson } from '../templates/renovate-json.js'

export const renovateTask = createSimpleFileTask({
	id: 'deps/renovate',
	label: 'Renovate config',
	group: 'Dependencies',
	applicable: (profile) => profile.hasGitHub,
	filepath: 'renovate.json',
	extensions: ['.json', '.json5'],
	render: (profile) => renderRenovateJson(profile),
})
