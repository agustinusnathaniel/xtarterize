import { readPackageJson } from '@xtarterize/core'
import { dlxCommand } from 'nypm'
import { createPackageJsonTask } from '@/factory.js'

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
		const dlx = dlxCommand(pm, 'npm-check-updates')
		const useUltracite = await hasUltracite(cwd)
		const scripts = useUltracite
			? [
					{ script: 'ultracite:check', value: 'ultracite check' },
					{ script: 'ultracite:fix', value: 'ultracite fix' },
				]
			: [
					{ script: 'lint', value: 'biome lint .' },
					{ script: 'format', value: 'biome format --write .' },
					{ script: 'check', value: 'biome check --write .' },
				]
		scripts.push(
			{ script: 'upgrade', value: `${dlx} -u && ${pm} install` },
			{ script: 'release', value: 'commit-and-tag-version' },
			{ script: 'plop', value: 'plop' },
		)

		if (profile.typescript) {
			scripts.push({ script: 'typecheck', value: 'tsc --noEmit' })
			scripts.push({ script: 'knip', value: 'knip' })
		}

		return scripts
	},
})
