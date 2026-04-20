import type { Task } from './_base.js'
import { backupFile } from './backup.js'
import type { ProjectProfile } from './detect.js'
import * as logger from './utils/logger.js'

export async function applyTasks(
	tasks: Task[],
	cwd: string,
	profile: ProjectProfile,
	selectedIds?: string[],
): Promise<{ applied: number; skipped: number; errors: string[] }> {
	const toApply = selectedIds
		? tasks.filter((t) => selectedIds.includes(t.id))
		: tasks

	let applied = 0
	let skipped = 0
	const errors: string[] = []

	for (const task of toApply) {
		try {
			const status = await task.check(cwd, profile)
			if (status === 'skip') {
				skipped++
				continue
			}

			logger.logInfo(`Applying: ${task.label} (${task.id})`)

			// Backup all files this task will modify before applying
			const diffs = await task.dryRun(cwd, profile)
			for (const diff of diffs) {
				await backupFile(cwd, diff.filepath)
			}

			await task.apply(cwd, profile)
			applied++
			logger.logSuccess(`${task.label} applied successfully`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			errors.push(`${task.id}: ${message}`)
			logger.logError(`Failed to apply ${task.id}: ${message}`)
		}
	}

	return { applied, skipped, errors }
}
