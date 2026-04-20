import { confirm, isCancel, spinner } from '@clack/prompts'
import type { FileDiff } from '@xtarterize/core'
import {
	applyTasks,
	detectProject,
	logger,
	resolveTaskStatuses,
	resolveTasks,
	runPreflight,
} from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'
import { defineCommand } from 'citty'
import { displayDiffs } from '../ui/diff-display.js'
import { displayPlan } from '../ui/plan-display.js'
import { selectTasks } from '../ui/select-menu.js'

export const syncCommand = defineCommand({
	meta: {
		name: 'sync',
		description: 'Update existing configurations to latest conformance',
	},
	args: {
		dryRun: {
			type: 'boolean',
			description: 'Preview changes without applying',
		},
		yes: {
			type: 'boolean',
			description: 'Skip all confirmations, apply all',
		},
		skip: {
			type: 'string',
			description: 'Exclude a specific task (comma-separated)',
		},
		only: {
			type: 'string',
			description: 'Apply only a specific task',
		},
		quiet: {
			type: 'boolean',
			description: 'Suppress interactive prompts and verbose output',
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
		let tasks = resolveTasks(profile, allTasks)
		const statuses = await resolveTaskStatuses(tasks, cwd, profile)

		if (args.skip) {
			const skipIds = args.skip.split(',').map((s) => s.trim())
			tasks = tasks.filter((t) => !skipIds.includes(t.id))
		}

		if (args.only) {
			const onlyIds = args.only.split(',').map((s) => s.trim())
			tasks = tasks.filter((t) => onlyIds.includes(t.id))
		}

		const actionableTasks = tasks.filter((t) => {
			const status = statuses.get(t.id)
			return status === 'patch' || status === 'conflict'
		})

		if (actionableTasks.length === 0) {
			logger.logSuccess('No updates available')
			return
		}

		if (!quiet) displayPlan(actionableTasks, statuses, 'Updates available')

		if (args.dryRun) {
			const diffs: FileDiff[] = []
			for (const task of actionableTasks) {
				const taskDiffs = await task.dryRun(cwd, profile)
				diffs.push(...taskDiffs)
			}
			displayDiffs(diffs)
			return
		}

		if (args.yes || quiet) {
			const result = await applyTasks(actionableTasks, cwd, profile)
			logger.log('')
			logger.logSuccess(`Applied ${result.applied} tasks`)
			if (result.errors.length > 0) {
				logger.logError(`${result.errors.length} errors`)
				result.errors.forEach((e) => {
					logger.logError(`  - ${e}`)
				})
			}
			return
		}

		const action = await confirm({
			message: 'Apply all updates? (yes/no)',
		})

		if (isCancel(action)) {
			logger.logInfo('Cancelled')
			return
		}

		if (!action) {
			const selected = await selectTasks(actionableTasks, statuses)
			if (selected.length === 0) {
				logger.logInfo('No tasks selected')
				return
			}

			const result = await applyTasks(actionableTasks, cwd, profile, selected)
			logger.log('')
			logger.logSuccess(`Applied ${result.applied} tasks`)
			if (result.errors.length > 0) {
				logger.logError(`${result.errors.length} errors`)
				result.errors.forEach((e) => {
					logger.logError(`  - ${e}`)
				})
			}
			return
		}

		const result = await applyTasks(actionableTasks, cwd, profile)
		logger.log('')
		logger.logSuccess(`Applied ${result.applied} tasks`)
		if (result.errors.length > 0) {
			logger.logError(`${result.errors.length} errors`)
		}
	},
})
