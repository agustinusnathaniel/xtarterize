import { spinner } from '@clack/prompts'
import {
	detectProject,
	pc,
	resolveTaskStatuses,
	resolveTasks,
	runPreflight,
} from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'
import { defineCommand } from 'citty'
import { resolveCwd } from '@/utils/cwd.js'

export const listCommand = defineCommand({
	meta: {
		name: 'list',
		description: 'List all available tasks',
	},
	args: {
		quiet: {
			type: 'boolean',
			description: 'Suppress verbose output',
		},
	},
	async run({ args }) {
		const cwd = resolveCwd(args)
		const isCI = process.env.CI === 'true' || process.env.CI === '1'
		const quiet = args.quiet || isCI

		const preflight = await runPreflight(cwd)
		if (!preflight.valid) {
			console.log('')
			console.log(`${pc.red('✖')} Preflight checks failed`)
			console.log('')
			for (const error of preflight.errors) {
				console.log(`${pc.red(`  ✗ ${error.message}`)}`)
				if (error.hint) {
					console.log(`  ${pc.dim(error.hint)}`)
				}
			}
			console.log('')
			process.exit(1)
		}

		const s = spinner()
		if (!quiet) s.start('Scanning project...')

		const profile = await detectProject(cwd)
		if (!quiet) s.stop('Project scanned')

		const allTasks = getAllTasks()
		const tasks = resolveTasks(profile, allTasks)
		const statuses = await resolveTaskStatuses(tasks, cwd, profile)

		let currentGroup = ''

		for (const task of tasks) {
			if (task.group !== currentGroup) {
				currentGroup = task.group
				console.log('')
				console.log(pc.bold(currentGroup))
			}

			const status = statuses.get(task.id) ?? 'new'
			const icon =
				status === 'skip'
					? '✔'
					: status === 'patch'
						? '~'
						: status === 'conflict'
							? '⚠'
							: '✗'

			console.log(`  ${icon} ${task.label.padEnd(40)} ${pc.dim(task.id)}`)
		}

		console.log('')
	},
})
