import { defineCommand } from 'citty'
import { spinner, confirm, isCancel, select } from '@clack/prompts'
import { detectProject, detectFramework, runPreflight } from '@xtarterize/core'
import type { Framework, ProjectProfile } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import { applyTasks } from '@xtarterize/core'
import { displayPlan } from '../ui/plan-display.js'
import { displayDiffs } from '../ui/diff-display.js'
import { selectTasks } from '../ui/select-menu.js'
import { logger } from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'

async function resolveAmbiguousFramework(pkg: any): Promise<Framework> {
  const choice = await select({
    message: 'Detected both React and React Native dependencies. Which best describes this project?',
    options: [
      { value: 'react', label: 'React (web)' },
      { value: 'react-native', label: 'React Native / Expo (mobile)' },
      { value: 'node', label: 'Universal (web + native, treating as Node)' },
    ],
  })

  if (isCancel(choice)) {
    process.exit(0)
  }

  return choice as Framework
}

function resolveFrameworkAmbiguity(profile: ProjectProfile, pkg: any): ProjectProfile {
  if (profile.framework !== null) return profile

  const allDeps: Record<string, string> = {}
  if (pkg?.dependencies) Object.assign(allDeps, pkg.dependencies)
  if (pkg?.devDependencies) Object.assign(allDeps, pkg.devDependencies)

  const framework = detectFramework(allDeps)
  if (framework !== null) return { ...profile, framework }

  return profile
}

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize xtarterize conformance for a project',
  },
  args: {
    dryRun: {
      type: 'boolean',
      description: 'Preview all changes without applying',
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
    quiet: {
      type: 'boolean',
      description: 'Suppress interactive prompts and verbose output',
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

    let profile = await detectProject(cwd)

    // Handle ambiguous framework detection at CLI layer
    if (profile.framework === null) {
      if (!quiet) s.stop()
      const pkg = await import('@xtarterize/core').then(m => m.readPackageJson(cwd))
      const allDeps: Record<string, string> = {}
      if (pkg?.dependencies) Object.assign(allDeps, pkg.dependencies)
      if (pkg?.devDependencies) Object.assign(allDeps, pkg.devDependencies)

      const hasReactNative = !!(allDeps['react-native'] || allDeps['expo'])
      const hasReact = !!allDeps['react']

      if (hasReactNative && hasReact) {
        if (quiet) {
          profile = { ...profile, framework: 'react' }
        } else {
          const resolved = await resolveAmbiguousFramework(pkg)
          profile = { ...profile, framework: resolved }
        }
      }
    } else {
      if (!quiet) s.stop('Project scanned')
    }

    if (!quiet) {
      logger.log('')
      logger.log(logger.bold(`Framework: ${profile.framework ?? 'none'}`))
      logger.log(logger.bold(`Bundler: ${profile.bundler ?? 'none'}`))
      logger.log(logger.bold(`Package Manager: ${profile.packageManager}`))
      logger.log('')
    }

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
      return status === 'new' || status === 'patch' || status === 'conflict'
    })

    if (actionableTasks.length === 0) {
      logger.logSuccess('Project is already fully conformant!')
      return
    }

    if (!quiet) displayPlan(tasks, statuses)

    if (args.dryRun) {
      const diffs: any[] = []
      for (const task of actionableTasks) {
        const taskDiffs = await task.dryRun(cwd, profile)
        diffs.push(...taskDiffs)
      }
      displayDiffs(diffs)
      return
    }

    if (args.yes || quiet) {
      const result = await applyTasks(actionableTasks, cwd, profile)
      logger.log('')
      logger.logSuccess(`Applied ${result.applied} tasks`)
      if (result.errors.length > 0) {
        logger.logError(`${result.errors.length} errors`)
        result.errors.forEach(e => { logger.logError(`  - ${e}`) })
      }
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
        result.errors.forEach(e => { logger.logError(`  - ${e}`) })
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
