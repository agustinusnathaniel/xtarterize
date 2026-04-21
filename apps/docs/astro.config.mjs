import starlight from '@astrojs/starlight'
import astroMermaid from 'astro-mermaid'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
	site: 'https://xtarterize.sznm.dev',
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		astroMermaid(),
		starlight({
			title: 'xtarterize',
			description:
				'an adaptive CLI tool that automates conformance configuration for JavaScript/TypeScript projects.',
			customCss: ['./src/styles/global.css'],
			social: [
				{
					icon: 'github',
					href: 'https://github.com/agustinusnathaniel/xtarterize',
					label: 'GitHub',
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					// autogenerate: { directory: 'getting-started' },
					items: [
						{
							label: 'Introduction',
							link: '/getting-started/introduction/'
						},
						{
							label: 'Installation',
							link: '/getting-started/installation/'
						},
						{
							label: 'Initialization',
							link: '/getting-started/initialization/'
						}
					]
				},
				{
					label: 'CLI Reference',
					link: '/guide/cli/overview/',
				},
				{
					label: 'Conformance Tasks',
					link: '/guide/tasks/overview/',
				},
				{
					label: 'Configuration',
					link: '/guide/config/overview/',
				},
				{
					label: 'Contributing',
					collapsed: true,
					items: [
						{
							label: 'Architecture',
							link: '/contributing/architecture/overview/',
						},
						{
							label: 'Project Detection',
							link: '/contributing/core/detect/',
						},
						{
							label: 'Preflight & Diagnostics',
							link: '/contributing/core/preflight/',
						},
						{
							label: 'Patchers',
							autogenerate: { directory: 'contributing/patchers' },
						},
					],
				},
			],
		}),
	],
})
