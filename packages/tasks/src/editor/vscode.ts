import { createMultiFileJsonMergeTask } from '../factory.js'
import { renderVscodeExtensions } from '../templates/vscode/extensions.js'
import { renderVscodeSettings } from '../templates/vscode/settings.js'

export const vscodeTask = createMultiFileJsonMergeTask({
	id: 'editor/vscode',
	label: 'VSCode settings + extensions',
	group: 'Editor',
	applicable: () => true,
	files: [
		{
			filepath: '.vscode/settings.json',
			extensions: ['.json'],
			incoming: (profile) => JSON.parse(renderVscodeSettings(profile)),
		},
		{
			filepath: '.vscode/extensions.json',
			extensions: ['.json'],
			incoming: (profile) => JSON.parse(renderVscodeExtensions(profile)),
		},
	],
})
