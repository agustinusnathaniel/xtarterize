import { createSimpleFileTask } from '../factory.js'
import { renderReleaseWorkflow } from '../templates/workflows/release-yml.js'

export const releaseWorkflowTask = createSimpleFileTask({
	id: 'ci/release',
	label: 'GitHub release workflow',
	group: 'CI/CD',
	applicable: (profile) => profile.hasGitHub,
	filepath: '.github/workflows/release.yml',
	render: (profile) => renderReleaseWorkflow(profile),
})
