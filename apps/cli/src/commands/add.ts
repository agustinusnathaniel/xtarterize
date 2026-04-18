import { defineCommand } from 'citty'
import { spinner, confirm, isCancel } from '@clack/prompts'
import { detectProject, runPreflight } from '@xtarterize/core'
import { displayDiffs } from '../ui/diff-display.js'
import { logger } from '@xtarterize/core'
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
    quiet: {
      type: 'boolean',
      description: 'Suppress interactive prompts',
    },
  },
  async run({ args }) {
    const taskId = args.taskId
    if (!taskId) {
      logger.logError('Task ID required. Usage: xtarterize add <task-id>')
      logger.logInfo('Available tasks:')
      const allTasks = getAllTasks()
      allTasks.forEach(t => { logger.log(`  ${t.id}`) })
      return
    }

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
    const task = allTasks.find(t => t.id === taskId)

    if (!task) {
      logger.logError(`Task "${taskId}" not found`)
      logger.logInfo('Available tasks:')
      allTasks.forEach(t => { logger.log(`  ${t.id}`) })
      return
    }

    if (!task.applicable(profile)) {
      logger.logWarn(`Task "${taskId}" is not applicable for this project`)
      return
    }

    const status = await task.check(cwd, profile)
    if (!quiet) logger.log(`Status: ${status}`)

    if (status === 'skip') {
      logger.logSuccess('Already conformant')
      return
    }

    const diffs = await task.dryRun(cwd, profile)
    if (!quiet) displayDiffs(diffs)

    if (!quiet) {
      const proceed = await confirm({ message: 'Apply this change?' })
      if (isCancel(proceed) || !proceed) return
    }

    await task.apply(cwd, profile)
    logger.logSuccess(`${task.id} applied successfully`)
  },
})
