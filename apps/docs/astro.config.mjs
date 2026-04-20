import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
	integrations: [
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
					label: 'User Guide',
					items: [
						{
							label: 'CLI Reference',
							autogenerate: { directory: 'guide/cli' },
						},
						{
							label: 'Conformance Tasks',
							autogenerate: { directory: 'guide/tasks' },
						},
						{
							label: 'Configuration',
							autogenerate: { directory: 'guide/config' },
						},
					],
				},
				{
					label: 'Contributing',
					items: [
						{
							label: 'Architecture',
							autogenerate: { directory: 'contributing/architecture' },
						},
						{
							label: 'Core',
							autogenerate: { directory: 'contributing/core' },
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
