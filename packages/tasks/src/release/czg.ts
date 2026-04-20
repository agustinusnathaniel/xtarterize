import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import { readPackageJson, writePackageJson } from '@xtarterize/core'
import { addDependency } from 'nypm'

export const czgTask: Task = {
	id: 'release/czg',
	label: 'czg (commitizen)',
	group: 'Release',
	applicable: () => true,

	async check(cwd, _profile): Promise<TaskStatus> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return 'conflict'

		const hasCzg = pkg?.devDependencies?.czg
		const hasCommitScript = pkg.scripts?.commit === 'czg'

		if (hasCzg && hasCommitScript) return 'skip'
		if (!hasCzg) return 'new'
		return 'patch'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return []

		const before = JSON.stringify(pkg, null, 2)
		const updated = { ...pkg }
		updated.scripts = { ...updated.scripts, commit: 'czg' }
		const after = JSON.stringify(updated, null, 2)

		return [{ filepath: 'package.json', before, after }]
	},

	async apply(cwd, _profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return

		if (!pkg.devDependencies?.czg) {
			await addDependency(['czg'], { cwd, dev: true })
		}

		pkg.scripts = { ...pkg.scripts, commit: 'czg' }
		await writePackageJson(cwd, pkg)
	},
}
