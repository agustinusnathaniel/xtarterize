import { createSimpleFileTask } from '@/factory.js'
import { renderKnipConfig } from '@/templates/knip-config.js'

export const knipTask = createSimpleFileTask({
	id: 'quality/knip',
	label: 'Knip (unused code detection)',
	group: 'Quality',
	applicable: (profile) => profile.typescript,
	filepath: 'knip.config',
	extensions: ['.ts', '.mts'],
	render: (profile) => renderKnipConfig(profile, 'ts'),
})
