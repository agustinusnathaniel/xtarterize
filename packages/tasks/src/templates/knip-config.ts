import type { ProjectProfile } from '@xtarterize/core'

function getEntryFiles(profile: ProjectProfile): string[] {
	if (profile.bundler === 'vite') {
		return ['src/main.tsx', 'src/main.ts']
	} else if (profile.bundler === 'nextjs') {
		return ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}']
	}
	return ['src/index.ts']
}

export function renderKnipConfig(
	profile: ProjectProfile,
	format: 'json' | 'ts' = 'ts',
): string {
	const entry = getEntryFiles(profile)
	const project = ['src/**/*.{ts,tsx,js,jsx,css,scss}']

	if (format === 'json') {
		return `${JSON.stringify({ entry, project }, null, 2)}\n`
	}

	return `import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ${JSON.stringify(entry)},
  project: ['src/**/*.{ts,tsx,js,jsx,css,scss}'],
};

export default config;
`
}
