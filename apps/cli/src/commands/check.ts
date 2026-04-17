import { defineCommand } from 'citty'
import { spinner } from '@clack/prompts'
import { detectProject } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import * as logger from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Audit current conformance status',
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

    let conformant = 0
    const total = tasks.length

    logger.log('')
    logger.log(logger.bold('Conformance audit'))
    logger.log('')

    for (const task of tasks) {
      const status = statuses.get(task.id) ?? 'new'
      const icon = status === 'skip'
        ? logger.green('✔')
        : status === 'patch'
          ? logger.yellow('~')
          : status === 'conflict'
            ? logger.red('⚠')
            : logger.red('✗')

      if (status === 'skip') conformant++

      logger.log(`  ${icon} ${task.label.padEnd(40)} ${logger.dim(task.id)} [${status}]`)
    }

    logger.log('')
    logger.log(logger.bold(`${conformant}/${total} conformant`))
    logger.log('')
  },
})
