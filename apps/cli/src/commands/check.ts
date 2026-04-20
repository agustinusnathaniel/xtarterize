import { spinner } from '@clack/prompts'
import type { DiagnosticCheck } from '@xtarterize/core'
import {
	detectProject,
	pc,
	resolveTaskStatuses,
	resolveTasks,
	runConflictChecks,
	runPreflight,
	runToolInstallationChecks,
} from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'
import { defineCommand } from 'citty'

function diagnosticIcon(status: DiagnosticCheck['status']): string {
	switch (status) {
		case 'pass':
			return pc.green('✔')
		case 'warn':
			return pc.yellow('~')
		case 'fail':
			return pc.red('✗')
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
			console.log('')
			console.log(`${pc.red('✖')} Preflight checks failed`)
			console.log('')
			for (const error of preflight.errors) {
				console.log(`${pc.red(`  ✗ ${error.message}`)}`)
				if (error.hint) {
					console.log(`  ${pc.dim(error.hint)}`)
				}
			}
			console.log('')
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
			console.log('')
			console.log(pc.bold('Conformance audit'))
			console.log('')

			for (const task of tasks) {
				const status = statuses.get(task.id) ?? 'new'
				const icon =
					status === 'skip'
						? pc.green('✔')
						: status === 'patch'
							? pc.yellow('~')
							: status === 'conflict'
								? pc.red('⚠')
								: pc.red('✗')

				if (status === 'skip') conformant++

				console.log(
					`  ${icon} ${task.label.padEnd(40)} ${pc.dim(task.id)} [${status}]`,
				)
			}

			console.log('')
			console.log(pc.bold(`${conformant}/${total} conformant`))

			const conflictChecks = await runConflictChecks(cwd)
			const installChecks = await runToolInstallationChecks(cwd)
			const diagnostics = [...installChecks, ...conflictChecks]

			if (diagnostics.length > 0) {
				console.log('')
				console.log(pc.bold('Diagnostics'))
				console.log('')

				for (const check of diagnostics) {
					console.log(`  ${diagnosticIcon(check.status)} ${check.message}`)
				}
			}

			console.log('')
		} else {
			for (const task of tasks) {
				const status = statuses.get(task.id) ?? 'new'
				if (status === 'skip') conformant++
			}
			console.log(`${conformant}/${total} conformant`)
		}
	},
})
