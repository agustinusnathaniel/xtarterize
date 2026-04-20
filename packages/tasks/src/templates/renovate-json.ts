import type { ProjectProfile } from '@xtarterize/core'

export function renderRenovateJson(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const _installCmd =
		pm === 'npm'
			? 'npm ci'
			: pm === 'yarn'
				? 'yarn install --frozen-lockfile'
				: `${pm} install --frozen-lockfile`

	return JSON.stringify(
		{
			$schema: 'https://docs.renovatebot.com/renovate-schema.json',
			extends: ['config:base'],
			packageRules: [
				{
					groupName: 'all non-major dependencies',
					groupSlug: 'all-minor-patch',
					matchUpdateTypes: ['minor', 'patch'],
					matchPackagePatterns: ['*'],
					automerge: true,
					automergeType: 'branch',
				},
			],
			major: { enabled: false },
			updatePinnedDependencies: false,
			stabilityDays: 2,
			schedule: ['before 1am on the first day of the month'],
		},
		null,
		2,
	)
}
