import type { ProjectProfile } from '@xtarterize/core'

export function renderBiomeJson(_profile: ProjectProfile): string {
	const config = {
		$schema: './node_modules/@biomejs/biome/configuration_schema.json',
		vcs: { enabled: true, clientKind: 'git', useIgnoreFile: true },
		files: {
			ignoreUnknown: false,
			includes: ['src/**/*', '*.config.ts', '!**/*.css', '!**/*.d.ts'],
		},
		formatter: { enabled: true, indentStyle: 'space' },
		linter: {
			enabled: true,
			rules: {
				recommended: true,
				style: {
					useConsistentArrayType: {
						level: 'error',
						options: { syntax: 'generic' },
					},
				},
			},
		},
		javascript: { formatter: { quoteStyle: 'single' } },
		assist: {
			enabled: true,
			actions: {
				source: {
					organizeImports: {
						level: 'on',
						options: {
							groups: [
								[':URL:', ':NODE:', ':PACKAGE:'],
								':BLANK_LINE:',
								[':ALIAS:'],
								':BLANK_LINE:',
								[':PATH:'],
							],
						},
					},
				},
			},
		},
	}
	return JSON.stringify(config, null, 2)
}
