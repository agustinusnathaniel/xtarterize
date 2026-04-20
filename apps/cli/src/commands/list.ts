import { spinner } from '@clack/prompts'
import {
	detectProject,
	logger,
	resolveTaskStatuses,
	resolveTasks,
	runPreflight,
} from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'
import { defineCommand } from 'citty'

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
		const cwd = process.cwd()
		const isCI = process.env.CI === 'true' || process.env.CI === '1'
		const quiet = args.quiet || isCI

		const preflight = await runPreflight(cwd)
		if (!preflight.valid) {
			logger.log('')
			logger.log(logger.red('✖ Preflight checks failed'))
			logger.log('')
			for (const error of preflight.errors) {
				logger.log(logger.red(`  ✗ ${error.message}`))
				if (error.hint) {
					logger.log(`  ${logger.dim(error.hint)}`)
				}
			}
			logger.log('')
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
				logger.log('')
				logger.log(logger.bold(currentGroup))
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

			logger.log(`  ${icon} ${task.label.padEnd(40)} ${logger.dim(task.id)}`)
		}

		logger.log('')
	},
})
