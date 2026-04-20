import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import { fileExists, readPackageJson, resolvePath, writePackageJson } from '@xtarterize/core'
import { dlxCommand } from 'nypm'

async function hasUltracite(cwd: string): Promise<boolean> {
	const pkg = await readPackageJson(cwd)
	return !!(pkg?.devDependencies?.ultracite || pkg?.dependencies?.ultracite)
}

export const packageScriptsTask: Task = {
	id: 'scripts/package-scripts',
	label: 'package.json scripts',
	group: 'Scripts',
	applicable: () => true,

	async check(cwd, _profile): Promise<TaskStatus> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return 'conflict'

		const scripts = pkg.scripts ?? {}
		const requiredScripts = ['lint', 'typecheck']
		const missing = requiredScripts.filter((s) => !scripts[s])

		if (missing.length === 0) return 'skip'
		if (missing.length < requiredScripts.length) return 'patch'
		return 'new'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return []

		const pm = profile.packageManager
		const useUltracite = await hasUltracite(cwd)
		const dlx = dlxCommand(pm, 'npm-check-updates')

		const scriptsToAdd = useUltracite
			? {
					lint: 'ultracite',
					typecheck: 'tsc --noEmit',
					upgrade: `${dlx} -u && ${pm} install`,
				}
			: {
					lint: 'biome check --write .',
					typecheck: 'tsc --noEmit',
					upgrade: `${dlx} -u && ${pm} install`,
				}

		const existing = pkg.scripts ?? {}
		const merged = { ...existing, ...scriptsToAdd }
		const after = JSON.stringify({ ...pkg, scripts: merged }, null, 2)
		const before = JSON.stringify(pkg, null, 2)

		return [{ filepath: 'package.json', before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return

		const pm = profile.packageManager
		const useUltracite = await hasUltracite(cwd)
		const dlx = dlxCommand(pm, 'npm-check-updates')

		const scriptsToAdd = useUltracite
			? {
					lint: 'ultracite',
					typecheck: 'tsc --noEmit',
					upgrade: `${dlx} -u && ${pm} install`,
				}
			: {
					lint: 'biome check --write .',
					typecheck: 'tsc --noEmit',
					upgrade: `${dlx} -u && ${pm} install`,
				}

		pkg.scripts = { ...pkg.scripts, ...scriptsToAdd }
		await writePackageJson(cwd, pkg)
	},
}
