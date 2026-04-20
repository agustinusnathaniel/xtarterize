import type { ProjectProfile } from '@xtarterize/core'

export function renderCiWorkflow(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const installCmd =
		pm === 'npm'
			? 'npm ci'
			: pm === 'yarn'
				? 'yarn install --frozen-lockfile'
				: `${pm} install --frozen-lockfile`
	const runCmd = pm === 'npm' ? 'npm run' : `${pm}`

	const steps = [
		'      - uses: actions/checkout@v4',
		'      - uses: actions/setup-node@v4',
		'        with:',
		'          node-version: 20',
		`      - run: ${installCmd}`,
		`      - run: ${runCmd} lint`,
		`      - run: ${runCmd} typecheck`,
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
