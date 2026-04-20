import { createSimpleFileTask } from '../factory.js'
import { renderCommitlintConfig } from '../templates/commitlint-config.js'

export const commitlintTask = createSimpleFileTask({
	id: 'release/commitlint',
	label: 'Commitlint config',
	group: 'Release',
	applicable: () => true,
	filepath: 'commitlint.config.ts',
	render: (profile) => renderCommitlintConfig(profile),
})
