import { defineCommand } from 'citty'
import { spinner, confirm, isCancel } from '@clack/prompts'
import { detectProject } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import { applyTasks } from '@xtarterize/core'
import { displayPlan } from '../ui/plan-display.js'
import { displayDiffs } from '../ui/diff-display.js'
import { selectTasks } from '../ui/select-menu.js'
import * as logger from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

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
  },
  async run({ args }) {
    const s = spinner()
    s.start('Scanning project...')

    const cwd = process.cwd()
    const profile = await detectProject(cwd)
    s.stop('Project scanned')

    const allTasks = getAllTasks()
    let tasks = resolveTasks(profile, allTasks)
    const statuses = await resolveTaskStatuses(tasks, cwd, profile)

    if (args.skip) {
      const skipIds = args.skip.split(',').map(s => s.trim())
      tasks = tasks.filter(t => !skipIds.includes(t.id))
    }

    if (args.only) {
      const onlyIds = args.only.split(',').map(s => s.trim())
      tasks = tasks.filter(t => onlyIds.includes(t.id))
    }

    const actionableTasks = tasks.filter(t => {
      const status = statuses.get(t.id)
      return status === 'patch' || status === 'conflict'
    })

    if (actionableTasks.length === 0) {
      logger.logSuccess('No updates available')
      return
    }

    displayPlan(actionableTasks, statuses, 'Updates available')

    if (args.dryRun) {
      const diffs: any[] = []
      for (const task of actionableTasks) {
        const taskDiffs = await task.dryRun(cwd, profile)
        diffs.push(...taskDiffs)
      }
      displayDiffs(diffs)
      return
    }

    if (args.yes) {
      const result = await applyTasks(actionableTasks, cwd, profile)
      logger.log('')
      logger.logSuccess(`Applied ${result.applied} tasks`)
      if (result.errors.length > 0) {
        logger.logError(`${result.errors.length} errors`)
        result.errors.forEach(e => logger.logError(`  - ${e}`))
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
        result.errors.forEach(e => logger.logError(`  - ${e}`))
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
