import { defineCommand } from 'citty'
import { pc, logInfo } from '@xtarterize/core'
import { runCommand } from './run-command.js'

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
		await runCommand(process.cwd(), args, {
			actionableStatuses: ['new', 'patch', 'conflict'],
			emptyMessage: 'Project is already fully conformant!',
			confirmMessage: 'Apply all changes? (yes/no)',
		})
		if (!args.dryRun) {
			console.log('')
			logInfo(`${pc.bold('Tip:')} For stricter, opinionated linting, run ${pc.cyan('npx ultracite init')} after this.`)
		}
	},
})
