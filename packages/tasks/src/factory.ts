import type { FileDiff, ProjectProfile, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readJsonIfExists,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { mergeJson, parseJsonc } from '@xtarterize/patchers'
import { addDependency } from 'nypm'
import JSON5 from 'json5'

export interface FileTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	filepath: string
	render: (profile: ProjectProfile) => string
	merge?: boolean
	depName?: string
	depInstallName?: string
	installDev?: boolean
	checkFn?: (cwd: string, profile: ProjectProfile, exists: boolean, content: string | null) => Promise<TaskStatus>
}

export function createFileTask(options: FileTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const fullPath = resolvePath(cwd, options.filepath)
			const exists = await fileExists(fullPath)
			if (!exists) return 'new'

			if (options.checkFn) {
				const content = await readFile(fullPath)
				return options.checkFn(cwd, profile, exists, content)
			}

			const expected = options.render(profile)
			const actual = await readFile(fullPath)

			if (options.merge) {
				const actualJson = parseJsonc(actual) as object
				const expectedJson = JSON5.parse(expected)
				const merged = mergeJson(actualJson, expectedJson)
				if (JSON.stringify(actualJson) === JSON.stringify(merged)) return 'skip'
				return 'patch'
			}

			if (actual.trim() === expected.trim()) return 'skip'
			return 'conflict'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const fullPath = resolvePath(cwd, options.filepath)
			const exists = await fileExists(fullPath)
			const before = exists ? await readFile(fullPath) : null

			let after: string
			if (options.merge && before) {
				const existing = parseJsonc(before) as object
				const incoming = JSON5.parse(options.render(profile))
				after = JSON.stringify(mergeJson(existing, incoming), null, 2)
			} else {
				after = options.render(profile)
			}

			return [{ filepath: options.filepath, before, after }]
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const { readPackageJson } = await import('@xtarterize/core')
				const pkg = await readPackageJson(cwd)
				const hasDep = pkg?.devDependencies?.[options.depName] || pkg?.dependencies?.[options.depName]
				if (!hasDep) {
					await addDependency([options.depInstallName ?? options.depName], { cwd, dev: options.installDev ?? true })
				}
			}

			const diffs = await this.dryRun(cwd, profile)
			for (const diff of diffs) {
				const fullPath = resolvePath(cwd, diff.filepath)
				await writeFile(fullPath, diff.after)
			}
		},
	}
}

export interface JsonMergeTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	filepath: string
	incoming: (profile: ProjectProfile) => object
	depName?: string
	installDev?: boolean
}

export function createJsonMergeTask(options: JsonMergeTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const fullPath = resolvePath(cwd, options.filepath)
			const exists = await fileExists(fullPath)
			if (!exists) return 'new'

			const { readPackageJson } = await import('@xtarterize/core')
			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				if (!pkg?.devDependencies?.[options.depName] && !pkg?.dependencies?.[options.depName]) {
					return 'patch'
				}
			}

			const actual = await readJsonIfExists(fullPath)
			const expected = options.incoming(profile)
			const merged = mergeJson(actual ?? {}, expected)
			if (JSON.stringify(actual) === JSON.stringify(merged)) return 'skip'
			return 'patch'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const fullPath = resolvePath(cwd, options.filepath)
			const exists = await fileExists(fullPath)
			const before = exists ? await readFile(fullPath) : null

			let after: string
		if (exists && before) {
				const existing = JSON5.parse(before)
				const incoming = options.incoming(profile)
				after = JSON.stringify(mergeJson(existing, incoming), null, 2)
			} else {
				after = JSON.stringify(options.incoming(profile), null, 2)
			}

			return [{ filepath: options.filepath, before, after }]
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const { readPackageJson } = await import('@xtarterize/core')
				const pkg = await readPackageJson(cwd)
				const hasDep = pkg?.devDependencies?.[options.depName] || pkg?.dependencies?.[options.depName]
				if (!hasDep) {
					await addDependency([options.depName], { cwd, dev: options.installDev ?? true })
				}
			}

			const diffs = await this.dryRun(cwd, profile)
			for (const diff of diffs) {
				const fullPath = resolvePath(cwd, diff.filepath)
				await writeFile(fullPath, diff.after)
			}
		},
	}
}

export interface SimpleFileTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	filepath: string
	render: (profile: ProjectProfile) => string
}

export function createSimpleFileTask(options: SimpleFileTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const fullPath = resolvePath(cwd, options.filepath)
			const exists = await fileExists(fullPath)
			if (!exists) return 'new'

			const expected = options.render(profile)
			const actual = await readFile(fullPath)
			if (actual.trim() === expected.trim()) return 'skip'
			return 'conflict'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const fullPath = resolvePath(cwd, options.filepath)
			const exists = await fileExists(fullPath)
			const before = exists ? await readFile(fullPath) : null
			const after = options.render(profile)

			return [{ filepath: options.filepath, before, after }]
		},

		async apply(cwd, profile): Promise<void> {
			const diffs = await this.dryRun(cwd, profile)
			for (const diff of diffs) {
				const fullPath = resolvePath(cwd, diff.filepath)
				await writeFile(fullPath, diff.after)
			}
		},
	}
}
