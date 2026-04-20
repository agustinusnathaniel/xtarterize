import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readJsonIfExists,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'

export const incrementalTask: Task = {
	id: 'ts/incremental',
	label: 'tsconfig — incremental: true',
	group: 'TypeScript',
	applicable: (profile) => profile.typescript,

	async check(cwd, _profile): Promise<TaskStatus> {
		const tsconfigPath = resolvePath(cwd, 'tsconfig.json')
		const exists = await fileExists(tsconfigPath)
		if (!exists) return 'conflict'

		const tsconfig = await readJsonIfExists(tsconfigPath)
		const compilerOptions = (tsconfig as any)?.compilerOptions
		if (compilerOptions?.incremental === true) return 'skip'

		return 'patch'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const tsconfigPath = resolvePath(cwd, 'tsconfig.json')
		const before = await readFile(tsconfigPath)
		const existing = JSON.parse(before)
		const incoming = {
			compilerOptions: { incremental: true, tsBuildInfoFile: '.tsbuildinfo' },
		}
		const merged = mergeJson(existing, incoming)
		const after = JSON.stringify(merged, null, 2)

		return [{ filepath: 'tsconfig.json', before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const diffs = await this.dryRun(cwd, profile)
		for (const diff of diffs) {
			const fullPath = resolvePath(cwd, diff.filepath)
			await writeFile(fullPath, diff.after)
		}
	},
}
