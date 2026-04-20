import type { ProjectProfile } from '@xtarterize/core'

export function renderVscodeSettings(profile: ProjectProfile): string {
	const settings: Record<string, unknown> = {
		'editor.defaultFormatter': 'biomejs.biome',
		'editor.formatOnSave': true,
		'editor.formatOnPaste': true,
		'editor.rulers': [100],
		'editor.codeActionsOnSave': {
			'source.fixAll.biome': 'explicit',
			'source.organizeImports.biome': 'explicit',
		},
		'[typescript]': { 'editor.defaultFormatter': 'biomejs.biome' },
		'[typescriptreact]': { 'editor.defaultFormatter': 'biomejs.biome' },
		'[javascript]': { 'editor.defaultFormatter': 'biomejs.biome' },
		'[json]': { 'editor.defaultFormatter': 'biomejs.biome' },
		'[jsonc]': { 'editor.defaultFormatter': 'biomejs.biome' },
	}

	if (profile.monorepo) {
		settings['typescript.tsdk'] = 'node_modules/typescript/lib'
	}

	if (profile.bundler === 'vite') {
		settings['files.associations'] = {
			'*.css': 'tailwindcss',
		}
	}

	return JSON.stringify(settings, null, 2)
}
