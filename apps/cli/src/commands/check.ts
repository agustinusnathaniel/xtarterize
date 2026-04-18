import { defineCommand } from 'citty'
import { spinner } from '@clack/prompts'
import { detectProject, runPreflight, runConflictChecks, runToolInstallationChecks } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import type { DiagnosticCheck } from '@xtarterize/core'
import { logger } from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

function diagnosticIcon(status: DiagnosticCheck['status']): string {
  switch (status) {
    case 'pass': return logger.green('✔')
    case 'warn': return logger.yellow('~')
    case 'fail': return logger.red('✗')
  }
}

export const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Audit current conformance status',
  },
  args: {
    verbose: {
      type: 'boolean',
      description: 'Show tool installation and conflict checks',
    },
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
    const allTasks = getAllTasks()
    const tasks = resolveTasks(profile, allTasks)
    const statuses = await resolveTaskStatuses(tasks, cwd, profile)
    if (!quiet) s.stop('Project scanned')

    let conformant = 0
    const total = tasks.length

    if (!quiet) {
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

      // Diagnostic checks (always run)
      const conflictChecks = await runConflictChecks(cwd)
      const installChecks = await runToolInstallationChecks(cwd)
      const diagnostics = [...installChecks, ...conflictChecks]

      if (diagnostics.length > 0) {
        logger.log('')
        logger.log(logger.bold('Diagnostics'))
        logger.log('')

        for (const check of diagnostics) {
          logger.log(`  ${diagnosticIcon(check.status)} ${check.message}`)
        }
      }

      logger.log('')
    } else {
      for (const task of tasks) {
        const status = statuses.get(task.id) ?? 'new'
        if (status === 'skip') conformant++
      }
      logger.log(`${conformant}/${total} conformant`)
    }
  },
})
