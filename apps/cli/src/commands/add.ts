import { defineCommand } from 'citty'
import { spinner, confirm, isCancel } from '@clack/prompts'
import { detectProject } from '@xtarterize/core'
import { displayDiffs } from '../ui/diff-display.js'
import * as logger from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

export const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Add a specific task',
  },
  args: {
    taskId: {
      type: 'positional',
      description: 'Task ID (e.g., lint/biome)',
    },
  },
  async run({ args }) {
    const taskId = args.taskId
    if (!taskId) {
      logger.logError('Task ID required. Usage: xtarterize add <task-id>')
      logger.logInfo('Available tasks:')
      const allTasks = getAllTasks()
      allTasks.forEach(t => logger.log(`  ${t.id}`))
      return
    }

    const s = spinner()
    s.start('Scanning project...')

    const cwd = process.cwd()
    const profile = await detectProject(cwd)
    s.stop('Project scanned')

    const allTasks = getAllTasks()
    const task = allTasks.find(t => t.id === taskId)

    if (!task) {
      logger.logError(`Task "${taskId}" not found`)
      logger.logInfo('Available tasks:')
      allTasks.forEach(t => logger.log(`  ${t.id}`))
      return
    }

    if (!task.applicable(profile)) {
      logger.logWarn(`Task "${taskId}" is not applicable for this project`)
      return
    }

    const status = await task.check(cwd, profile)
    logger.log(`Status: ${status}`)

    if (status === 'skip') {
      logger.logSuccess('Already conformant')
      return
    }

    const diffs = await task.dryRun(cwd, profile)
    displayDiffs(diffs)

    const proceed = await confirm({ message: 'Apply this change?' })
    if (isCancel(proceed) || !proceed) return

    await task.apply(cwd, profile)
    logger.logSuccess(`${task.id} applied successfully`)
  },
})
