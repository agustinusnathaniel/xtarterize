import type { ProjectProfile } from '@xtarterize/core'

export function renderKnipConfig(profile: ProjectProfile): string {
	let entry = ['src/index.ts']

	if (profile.bundler === 'vite') {
		entry = ['src/main.tsx', 'src/main.ts']
	} else if (profile.bundler === 'nextjs') {
		entry = ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}']
	}

	return `import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ${JSON.stringify(entry)},
  project: ['src/**/*.{ts,tsx,js,jsx,css,scss}'],
};

export default config;
`
}
