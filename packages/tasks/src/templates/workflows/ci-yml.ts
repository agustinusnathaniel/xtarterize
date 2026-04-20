import type { ProjectProfile } from '@xtarterize/core'
import { installDependenciesCommand, runScriptCommand } from 'nypm'

export function renderCiWorkflow(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const installCmd = installDependenciesCommand(pm, { silent: true, ignoreWorkspace: true })
	const runLint = runScriptCommand(pm, 'lint')
	const runTypecheck = runScriptCommand(pm, 'typecheck')

	const steps = [
		'      - uses: actions/checkout@v4',
		'      - uses: actions/setup-node@v4',
		'        with:',
		'          node-version: 20',
		`      - run: ${installCmd}`,
		`      - run: ${runLint}`,
		`      - run: ${runTypecheck}`,
	]

	return `name: CI

on:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
${steps.join('\n')}
`
}
