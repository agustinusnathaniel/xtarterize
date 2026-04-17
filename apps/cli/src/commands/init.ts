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

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize xtarterize conformance for a project',
  },
  args: {
    dryRun: {
      type: 'boolean',
      description: 'Preview changes without applying',
    },
  },
  async run({ args }) {
    const s = spinner()
    s.start('Scanning project...')

    const cwd = process.cwd()
    const profile = await detectProject(cwd)
    s.stop('Project scanned')

    logger.log('')
    logger.log(logger.bold(`Framework: ${profile.framework ?? 'none'}`))
    logger.log(logger.bold(`Bundler: ${profile.bundler ?? 'none'}`))
    logger.log(logger.bold(`Package Manager: ${profile.packageManager}`))
    logger.log('')

    const allTasks = getAllTasks()
    const tasks = resolveTasks(profile, allTasks)
    const statuses = await resolveTaskStatuses(tasks, cwd, profile)

    const actionableTasks = tasks.filter(t => {
      const status = statuses.get(t.id)
      return status === 'new' || status === 'patch' || status === 'conflict'
    })

    if (actionableTasks.length === 0) {
      logger.logSuccess('Project is already fully conformant!')
      return
    }

    displayPlan(tasks, statuses)

    if (args.dryRun) {
      const diffs: any[] = []
      for (const task of actionableTasks) {
        const taskDiffs = await task.dryRun(cwd, profile)
        diffs.push(...taskDiffs)
      }
      displayDiffs(diffs)
      return
    }

    const action = await confirm({
      message: 'Apply all changes? (yes/no)',
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
