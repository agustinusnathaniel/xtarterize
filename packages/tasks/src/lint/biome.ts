import { createJsonMergeTask } from '../factory.js'
import { renderBiomeJson } from '../templates/biome-json.js'

async function findBiomeConfigPath(cwd: string): Promise<string | null> {
	const { fileExists, resolvePath } = await import('@xtarterize/core')
	const jsonPath = resolvePath(cwd, 'biome.json')
	if (await fileExists(jsonPath)) return jsonPath
	const jsoncPath = resolvePath(cwd, 'biome.jsonc')
	if (await fileExists(jsoncPath)) return jsoncPath
	return null
}

export const biomeTask = createJsonMergeTask({
	id: 'lint/biome',
	label: 'Biome (lint + format)',
	group: 'Linting & Formatting',
	applicable: () => true,
	filepath: 'biome.json',
	incoming: (profile) => JSON.parse(renderBiomeJson(profile)),
	depName: '@biomejs/biome',
	installDev: true,
})
