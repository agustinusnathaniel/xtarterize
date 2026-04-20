import type { ProjectProfile } from '@xtarterize/core'

export function renderReleaseWorkflow(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const installCmd =
		pm === 'npm'
			? 'npm ci'
			: pm === 'yarn'
				? 'yarn install --frozen-lockfile'
				: `${pm} install --frozen-lockfile`
	const runCmd = pm === 'npm' ? 'npm run' : `${pm}`

	return `name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: ${installCmd}
      - run: ${runCmd} build
      - run: ${runCmd} typecheck
`
}
