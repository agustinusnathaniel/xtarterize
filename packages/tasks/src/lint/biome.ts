import { createJsonMergeTask } from '../factory.js'
import { renderBiomeJson } from '../templates/biome-json.js'

export const biomeTask = createJsonMergeTask({
	id: 'lint/biome',
	label: 'Biome (lint + format)',
	group: 'Linting & Formatting',
	applicable: () => true,
	filepath: 'biome.json',
	extensions: ['.json', '.jsonc'],
	incoming: (profile) => JSON.parse(renderBiomeJson(profile)),
	depName: '@biomejs/biome',
	installDev: true,
})
