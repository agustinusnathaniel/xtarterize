import type { ProjectProfile } from '@xtarterize/core'

export function renderAutoUpdateWorkflow(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const installCmd =
		pm === 'npm'
			? 'npm ci'
			: pm === 'yarn'
				? 'yarn install --frozen-lockfile'
				: `${pm} install --frozen-lockfile`
	const dlx = pm === 'pnpm' ? 'pnpm dlx' : pm === 'yarn' ? 'yarn dlx' : pm === 'bun' ? 'bunx' : 'npx'
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
      - run: ${dlx} npm-check-updates -u
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
