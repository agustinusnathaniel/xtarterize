import type { ProjectProfile } from '@xtarterize/core'

export function renderRenovateJson(_profile: ProjectProfile): string {
	return JSON.stringify(
		{
			$schema: 'https://docs.renovatebot.com/renovate-schema.json',
			extends: ['config:base', 'group:all'],
			timezone: 'Asia/Jakarta',
			rangeStrategy: 'bump',
			ignoreDeps: ['node', 'pnpm'],
			updatePinnedDependencies: false,
			stabilityDays: 2,
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
			schedule: ['before 1am on the first day of the month'],
		},
		null,
		2,
	)
}
