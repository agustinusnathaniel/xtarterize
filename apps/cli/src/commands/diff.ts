import { defineCommand } from 'citty'
import { spinner } from '@clack/prompts'
import { detectProject } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import { displayDiffs } from '../ui/diff-display.js'
import * as logger from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

export const diffCommand = defineCommand({
  meta: {
    name: 'diff',
    description: 'Show pending changes without applying',
  },
  async run() {
    const s = spinner()
    s.start('Scanning project...')

    const cwd = process.cwd()
    const profile = await detectProject(cwd)
    s.stop('Project scanned')

    const allTasks = getAllTasks()
    const tasks = resolveTasks(profile, allTasks)
    const statuses = await resolveTaskStatuses(tasks, cwd, profile)

    const diffs: any[] = []
    for (const task of tasks) {
      const status = statuses.get(task.id)
      if (status === 'new' || status === 'patch') {
        const taskDiffs = await task.dryRun(cwd, profile)
        diffs.push(...taskDiffs)
      }
    }

    if (diffs.length === 0) {
      logger.logSuccess('No pending changes')
      return
    }

    displayDiffs(diffs)
  },
})
