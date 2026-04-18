import { defineCommand } from 'citty'
import { spinner } from '@clack/prompts'
import { detectProject } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import { logger } from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

export const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List all available tasks',
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

    let currentGroup = ''

    for (const task of tasks) {
      if (task.group !== currentGroup) {
        currentGroup = task.group
        logger.log('')
        logger.log(logger.bold(currentGroup))
      }

      const status = statuses.get(task.id) ?? 'new'
      const icon = status === 'skip' ? '✔' : status === 'patch' ? '~' : status === 'conflict' ? '⚠' : '✗'

      logger.log(`  ${icon} ${task.label.padEnd(40)} ${logger.dim(task.id)}`)
    }

    logger.log('')
  },
})
