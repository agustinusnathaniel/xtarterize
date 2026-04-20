import type { ProjectProfile } from '@xtarterize/core'
import { dlxCommand, installDependenciesCommand } from 'nypm'

export function renderAutoUpdateWorkflow(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const installCmd = installDependenciesCommand(pm, { silent: true, ignoreWorkspace: true })
	const dlx = dlxCommand(pm, 'npm-check-updates')
	const nodeVersion = profile.framework === 'react-native' ? '20' : '20'

	return `name: Auto Update Dependencies

on:
  schedule:
    - cron: '0 6 * * 1'
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${nodeVersion}
      - run: ${installCmd}
      - run: ${dlx}
      - run: ${installCmd}
      - uses: peter-evans/create-pull-request@v6
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore(deps): update dependencies'
          title: 'chore(deps): update dependencies'
          body: 'Automated dependency updates'
          branch: chore/update-dependencies
          delete-branch: true
`
}
