import { readPackageJson } from '@xtarterize/core'
import { createPackageJsonTask } from '@/factory.js'

function getUpgradeCommand(pm: string): string {
	switch (pm) {
		case 'pnpm':
			return 'pnpm up -i -L'
		case 'yarn':
			return 'yarn upgrade-interactive --latest'
		case 'npm':
			return 'npx npm-check-updates -i'
		case 'bun':
			return 'bun update'
		default:
			return 'npx npm-check-updates -i'
	}
}

async function hasUltracite(cwd: string): Promise<boolean> {
	const pkg = await readPackageJson(cwd)
	return !!(pkg?.devDependencies?.ultracite || pkg?.dependencies?.ultracite)
}

export const packageScriptsTask = createPackageJsonTask({
	id: 'scripts/package-scripts',
	label: 'package.json scripts',
	group: 'Scripts',
	applicable: () => true,
	getScripts: async (cwd, profile) => {
		const pm = profile.packageManager
		const useUltracite = await hasUltracite(cwd)
		const scripts = useUltracite
			? [
					{ script: 'ultracite:check', value: 'ultracite check' },
					{ script: 'ultracite:fix', value: 'ultracite fix' },
				]
			: [
					{ script: 'biome', value: 'biome check .' },
					{ script: 'biome:fix', value: 'biome check --write .' },
				]
		scripts.push(
			{ script: 'test', value: 'vitest run' },
			{ script: 'upgrade', value: getUpgradeCommand(pm) },
			{ script: 'release', value: 'commit-and-tag-version' },
			{ script: 'plop', value: 'plop' },
		)

		if (profile.typescript) {
			scripts.push({ script: 'typecheck', value: 'tsc --noEmit' })
			scripts.push({ script: 'knip', value: 'knip' })
		}

		const hasTurbo =
			profile.monorepoTool === 'turbo' || profile.existing.turbo
		if (hasTurbo) {
			const checkTasks = useUltracite
				? ['ultracite:check']
				: ['biome']
			if (profile.typescript) checkTasks.push('typecheck')
			checkTasks.push('test')
			scripts.push({
				script: 'check:turbo',
				value: `turbo run ${checkTasks.join(' ')}`,
			})
		}

		return scripts
	},
})
