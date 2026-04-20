import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readPackageJson,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { addDependency } from 'nypm'
import { renderKnipConfig } from '../templates/knip-config.js'

export const knipTask: Task = {
	id: 'quality/knip',
	label: 'Knip (unused code detection)',
	group: 'Quality',
	applicable: (profile) => profile.typescript,

	async check(cwd, profile): Promise<TaskStatus> {
		const configPath = resolvePath(cwd, 'knip.json')
		const exists = await fileExists(configPath)

		const pkg = await readPackageJson(cwd)
		const hasKnip = pkg?.devDependencies?.knip

		if (exists && hasKnip) {
			const expected = renderKnipConfig(profile)
			const actual = await readFile(configPath)
			if (actual.trim() === expected.trim()) return 'skip'
			return 'patch'
		}
		if (!exists && !hasKnip) return 'new'
		return 'patch'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const configPath = resolvePath(cwd, 'knip.json')
		const exists = await fileExists(configPath)
		const before = exists ? await readFile(configPath) : null
		const after = renderKnipConfig(profile)

		return [{ filepath: 'knip.json', before, after }]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg?.devDependencies?.knip) {
			await addDependency(['knip'], { cwd, dev: true })
		}

		const diffs = await this.dryRun(cwd, profile)
		for (const diff of diffs) {
			const fullPath = resolvePath(cwd, diff.filepath)
			await writeFile(fullPath, diff.after)
		}
	},
}
