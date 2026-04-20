import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readPackageJson,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { addDependency } from 'nypm'
import { renderPlopfile } from '../templates/plopfile.js'

export const plopTask: Task = {
	id: 'codegen/plop',
	label: 'Plop (code generator)',
	group: 'Codegen',
	applicable: () => true,

	async check(cwd, profile): Promise<TaskStatus> {
		const plopfilePath = resolvePath(cwd, 'plopfile.ts')
		const exists = await fileExists(plopfilePath)

		const pkg = await readPackageJson(cwd)
		const hasPlop = pkg?.devDependencies?.plop

		if (exists && hasPlop) {
			const expected = renderPlopfile(profile)
			const actual = await readFile(plopfilePath)
			if (actual.trim() === expected.trim()) return 'skip'
			return 'patch'
		}
		if (!exists && !hasPlop) return 'new'
		return 'patch'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const plopfilePath = resolvePath(cwd, 'plopfile.ts')
		const exists = await fileExists(plopfilePath)
		const before = exists ? await readFile(plopfilePath) : null
		const after = renderPlopfile(profile)

		return [{ filepath: 'plopfile.ts', before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg?.devDependencies?.plop) {
			await addDependency(['plop'], { cwd, dev: true })
		}

		const diffs = await this.dryRun(cwd, profile)
		for (const diff of diffs) {
			const fullPath = resolvePath(cwd, diff.filepath)
			await writeFile(fullPath, diff.after)
		}
	},
}
