import { createPackageJsonTask } from '@/factory.js'
import { dlxCommand } from 'nypm'
import { readPackageJson } from '@xtarterize/core'

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
		const dlx = dlxCommand(pm, 'npm-check-updates')

		const lint = useUltracite ? 'ultracite' : 'biome check --write .'
		return [
			{ script: 'lint', value: lint },
			{ script: 'typecheck', value: 'tsc --noEmit' },
			{ script: 'upgrade', value: `${dlx} -u && ${pm} install` },
		]
	},
	checkFn: async (cwd, _profile, pkg) => {
		const scripts = (pkg as Record<string, Record<string, string>>).scripts ?? {}
		const requiredScripts = ['lint', 'typecheck']
		const missing = requiredScripts.filter((s) => !scripts[s])

		if (missing.length === 0) return 'skip'
		if (missing.length < requiredScripts.length) return 'patch'
		return 'new'
	},
})
