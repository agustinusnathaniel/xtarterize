import starlight from '@astrojs/starlight'
import astroMermaid from 'astro-mermaid'
import { defineConfig } from 'astro/config'

export default defineConfig({
	integrations: [
		astroMermaid(),
		starlight({
			title: 'Xtarterize',
			description:
				'An adaptive CLI tool that automates conformance configuration for JavaScript/TypeScript projects.',
			social: [
				{
					icon: 'github',
					href: 'https://github.com/your-org/xtarterize',
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
