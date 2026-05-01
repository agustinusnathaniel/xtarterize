import { createJsonMergeTask } from '@/factory.js'

export const renovateTask = createJsonMergeTask({
	id: 'deps/renovate',
	label: 'Renovate config',
	group: 'Dependencies',
	applicable: (profile) => profile.hasGitHub,
	filepath: 'renovate.json',
	extensions: ['.json', '.json5'],
	incoming: () => ({
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
	}),
})
