import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readPackageJson,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { addDependency } from 'nypm'
import { renderCommitlintConfig } from '../templates/commitlint-config.js'

export const commitlintTask: Task = {
	id: 'release/commitlint',
	label: 'Commitlint config',
	group: 'Release',
	applicable: () => true,

	async check(cwd, profile): Promise<TaskStatus> {
		const configPath = resolvePath(cwd, 'commitlint.config.ts')
		const exists = await fileExists(configPath)
		if (!exists) return 'new'

		const expected = renderCommitlintConfig(profile)
		const actual = await readFile(configPath)
		if (actual.trim() === expected.trim()) return 'skip'

		const pkg = await readPackageJson(cwd)
		const hasCommitlint =
			pkg?.devDependencies?.['@commitlint/config-conventional']
		if (!hasCommitlint) return 'patch'

		return 'conflict'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const configPath = resolvePath(cwd, 'commitlint.config.ts')
		const exists = await fileExists(configPath)
		const before = exists ? await readFile(configPath) : null
		const after = renderCommitlintConfig(profile)

		return [{ filepath: 'commitlint.config.ts', before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg?.devDependencies?.['@commitlint/config-conventional']) {
			await addDependency(
				[
					'@commitlint/cli',
					'@commitlint/config-conventional',
					'@commitlint/types',
				],
				{ cwd, dev: true },
			)
		}

		const diffs = await this.dryRun(cwd, profile)
		for (const diff of diffs) {
			const fullPath = resolvePath(cwd, diff.filepath)
			await writeFile(fullPath, diff.after)
		}
	},
}
