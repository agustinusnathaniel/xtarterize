import type { ProjectProfile } from '@xtarterize/core'
import { installDependenciesCommand, runScriptCommand } from 'nypm'

export function renderReleaseWorkflow(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const installCmd = installDependenciesCommand(pm, { silent: true, ignoreWorkspace: true })
	const runTypecheck = runScriptCommand(pm, 'typecheck')

	const steps = [
		'      - uses: actions/checkout@v4',
		'      - uses: actions/setup-node@v4',
		'        with:',
		'          node-version: 20',
		`      - run: ${installCmd}`,
		`      - run: ${runTypecheck}`,
	]

	return `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
${steps.join('\n')}
`
}
