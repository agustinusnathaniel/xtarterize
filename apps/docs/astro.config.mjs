import starlight from '@astrojs/starlight'
import astroMermaid from 'astro-mermaid'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
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
					autogenerate: { directory: 'getting-started' },
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
							label: 'Patchers',
							autogenerate: { directory: 'contributing/patchers' },
						},
					],
				},
			],
		}),
	],
})
