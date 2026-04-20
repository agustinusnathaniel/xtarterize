import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import { fileExists, readFile, resolvePath, writeFile } from '@xtarterize/core'

const ENTRIES = ['*.tsbuildinfo', '.tsbuildinfo/']

export const gitignoreTsbuildinfoTask: Task = {
	id: 'gitignore/tsbuildinfo',
	label: '.gitignore — tsbuildinfo',
	group: 'TypeScript',
	applicable: (profile) => profile.typescript,

	async check(cwd, _profile): Promise<TaskStatus> {
		const gitignorePath = resolvePath(cwd, '.gitignore')
		const exists = await fileExists(gitignorePath)
		if (!exists) return 'new'

		const content = await readFile(gitignorePath)
		const allPresent = ENTRIES.every((entry) => content.includes(entry))
		if (allPresent) return 'skip'

		return 'patch'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const gitignorePath = resolvePath(cwd, '.gitignore')
		const exists = await fileExists(gitignorePath)
		const before = exists ? await readFile(gitignorePath) : null

		const missing = ENTRIES.filter(
			(entry) => !before?.includes(entry),
		)
		const after = before
			? `${before.replace(/\n*$/, '')}\n\n# TypeScript incremental build info\n${missing.map((e) => `${e}\n`).join('')}`
			: `# TypeScript incremental build info\n${ENTRIES.map((e) => `${e}\n`).join('')}`

		return [{ filepath: '.gitignore', before, after }]
	},

	async apply(cwd, _profile): Promise<void> {
		const diffs = await this.dryRun(cwd, _profile)
		for (const diff of diffs) {
			const fullPath = resolvePath(cwd, diff.filepath)
			await writeFile(fullPath, diff.after)
		}
	},
}
