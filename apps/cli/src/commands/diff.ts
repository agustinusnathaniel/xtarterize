import { defineCommand } from 'citty'
import { spinner } from '@clack/prompts'
import { detectProject, runPreflight, type FileDiff } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import { displayDiffs } from '../ui/diff-display.js'
import { logger } from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

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

    const diffs: FileDiff[] = []
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
