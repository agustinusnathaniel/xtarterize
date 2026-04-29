import { isCancel, select, spinner } from '@clack/prompts'
import type { FileDiff, TaskStatus } from '@xtarterize/core'
import {
	applyTasks,
	detectProject,
	logError,
	logInfo,
	logSuccess,
	pc,
	readPackageJson,
	resolveTaskStatuses,
	resolveTasks,
	runPreflight,
} from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'
import { displayDiffs } from '@/ui/diff-display.js'
import { displayPlan } from '@/ui/plan-display.js'
import { selectTasks } from '@/ui/select-menu.js'

interface CommandArgs {
	dryRun?: boolean
	yes?: boolean
	skip?: string
	only?: string
	quiet?: boolean
}

interface RunCommandOptions {
	actionableStatuses: TaskStatus[]
	emptyMessage: string
	confirmMessage: string
}

export async function runCommand(
	cwd: string,
	args: CommandArgs,
	options: RunCommandOptions,
): Promise<void> {
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

	let profile = await detectProject(cwd)

	if (profile.framework === null) {
		if (!quiet) s.stop()
		const pkg = await readPackageJson(cwd)
		const allDeps: Record<string, string> = {}
		if (pkg?.dependencies) Object.assign(allDeps, pkg.dependencies)
		if (pkg?.devDependencies) Object.assign(allDeps, pkg.devDependencies)

		const hasReactNative = !!(allDeps['react-native'] || allDeps.expo)
		const hasReact = !!allDeps.react

		if (hasReactNative && hasReact) {
			if (quiet) {
				profile = { ...profile, framework: 'react' }
			} else {
				const resolved = await resolveAmbiguousFramework()
				profile = { ...profile, framework: resolved }
			}
		}
	} else {
		if (!quiet) s.stop('Project scanned')
	}

	if (!quiet) {
		console.log('')
		console.log(`${pc.bold(`Framework: ${profile.framework ?? 'none'}`)}`)
		console.log(`${pc.bold(`Bundler: ${profile.bundler ?? 'none'}`)}`)
		console.log(`${pc.bold(`Package Manager: ${profile.packageManager}`)}`)
		console.log('')
	}

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
		return status !== undefined && options.actionableStatuses.includes(status)
	})

	if (actionableTasks.length === 0) {
		logSuccess(options.emptyMessage)
		return
	}

	if (!quiet) displayPlan(actionableTasks, statuses)

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
		console.log('')
		logSuccess(`Applied ${result.applied} tasks`)
		if (result.errors.length > 0) {
			logError(`${result.errors.length} errors`)
			result.errors.forEach((e) => {
				logError(`  - ${e}`)
			})
		}
		return
	}

	const action = await select({
		message: options.confirmMessage,
		options: [
			{ value: 'apply-all', label: 'Apply all' },
			{ value: 'select', label: 'Select tasks' },
			{ value: 'dry-run', label: 'Dry run' },
			{ value: 'quit', label: 'Quit' },
		],
	})

	if (isCancel(action)) {
		logInfo('Cancelled')
		return
	}

	if (action === 'quit') {
		logInfo('Cancelled')
		return
	}

	if (action === 'dry-run') {
		const diffs: FileDiff[] = []
		for (const task of actionableTasks) {
			const taskDiffs = await task.dryRun(cwd, profile)
			diffs.push(...taskDiffs)
		}
		displayDiffs(diffs)
		return
	}

	if (action === 'select') {
		const selected = await selectTasks(actionableTasks, statuses)
		if (selected.length === 0) {
			logInfo('No tasks selected')
			return
		}

		const result = await applyTasks(actionableTasks, cwd, profile, selected)
		console.log('')
		logSuccess(`Applied ${result.applied} tasks`)
		if (result.errors.length > 0) {
			logError(`${result.errors.length} errors`)
			result.errors.forEach((e) => {
				logError(`  - ${e}`)
			})
		}
		return
	}

	const selectedIds = actionableTasks.map((task) => task.id)
	const result = await applyTasks(actionableTasks, cwd, profile, selectedIds)
	console.log('')
	logSuccess(`Applied ${result.applied} tasks`)
	if (result.errors.length > 0) {
		logError(`${result.errors.length} errors`)
	}
}

async function resolveAmbiguousFramework(): Promise<
	'react' | 'react-native' | 'node'
> {
	const choice = await select({
		message:
			'Detected both React and React Native dependencies. Which best describes this project?',
		options: [
			{ value: 'react', label: 'React (web)' },
			{ value: 'react-native', label: 'React Native / Expo (mobile)' },
			{ value: 'node', label: 'Universal (web + native, treating as Node)' },
		],
	})

	if (isCancel(choice)) {
		process.exit(0)
	}

	return choice as 'react' | 'react-native' | 'node'
}
