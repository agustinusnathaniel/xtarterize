import { spinner } from '@clack/prompts'
import {
	detectProject,
	type FileDiff,
	logSuccess,
	pc,
	resolveTaskStatuses,
	resolveTasks,
	runPreflight,
} from '@xtarterize/core'
import { patchJson } from '@xtarterize/patchers'
import { getAllTasks } from '@xtarterize/tasks'
import { defineCommand } from 'citty'
import { displayDiffs } from '@/ui/diff-display.js'
import { resolveCwd } from '@/utils/cwd.js'

function mergeFileDiffs(diffs: FileDiff[]): FileDiff[] {
	const grouped = new Map<string, FileDiff[]>()
	for (const diff of diffs) {
		const list = grouped.get(diff.filepath) ?? []
		list.push(diff)
		grouped.set(diff.filepath, list)
	}

	const merged: FileDiff[] = []
	for (const [filepath, list] of grouped) {
		if (list.length === 1) {
			merged.push(list[0])
			continue
		}

		if (
			filepath.endsWith('.json') ||
			filepath.endsWith('.jsonc') ||
			filepath.endsWith('.json5')
		) {
			const first = list.find((d) => d.before !== null)
			const before = first?.before ?? list[0].before
			let after = before ?? '{}'
			for (const diff of list) {
				try {
					after = patchJson(after, JSON.parse(diff.after))
				} catch {
					after = diff.after
				}
			}
			merged.push({ filepath, before, after })
		} else {
			merged.push(list[list.length - 1])
		}
	}

	return merged
}

export const diffCommand = defineCommand({
	meta: {
		name: 'diff',
		description: 'Show pending changes without applying',
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

		const diffs: FileDiff[] = []
		for (const task of tasks) {
			const status = statuses.get(task.id)
			if (status === 'new' || status === 'patch') {
				const taskDiffs = await task.dryRun(cwd, profile)
				diffs.push(...taskDiffs)
			}
		}

		if (diffs.length === 0) {
			logSuccess('No pending changes')
			return
		}

		displayDiffs(mergeFileDiffs(diffs))
	},
})
