import { createSimpleFileTask } from '../factory.js'
import { renderPlopfile } from '../templates/plopfile.js'

export const plopTask = createSimpleFileTask({
	id: 'codegen/plop',
	label: 'Plop (code generator)',
	group: 'Codegen',
	applicable: () => true,
	filepath: 'plopfile.ts',
	render: (profile) => renderPlopfile(profile),
})
