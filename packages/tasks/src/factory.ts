import type {
	FileDiff,
	ProjectProfile,
	Task,
	TaskStatus,
} from '@xtarterize/core'
import {
	ensureDir,
	fileExists,
	findConfigFile,
	readFile,
	readJsonIfExists,
	readPackageJson,
	resolvePath,
	writeFile,
	writePackageJson,
} from '@xtarterize/core'
import { injectVitePlugin, mergeJson, parseJsonc, patchJson } from '@xtarterize/patchers'
import JSON5 from 'json5'
import { addDependency } from 'nypm'
import { relative } from 'pathe'

function relativeToCwd(fullPath: string, cwd: string): string {
	return relative(cwd, fullPath)
}

export function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true
	if (typeof a !== typeof b) return false
	if (typeof a !== 'object' || a === null || b === null) return false
	if (Array.isArray(a) !== Array.isArray(b)) return false
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false
		return a.every((v, i) => deepEqual(v, b[i]))
	}
	const aKeys = Object.keys(a as object)
	const bKeys = Object.keys(b as object)
	if (aKeys.length !== bKeys.length) return false
	return aKeys.every((k) =>
		deepEqual(
			(a as Record<string, unknown>)[k],
			(b as Record<string, unknown>)[k],
		),
	)
}

export function normalizeExtends<T extends object>(obj: T): T {
	if (!('extends' in obj)) return obj
	const ext = (obj as Record<string, unknown>).extends
	if (typeof ext === 'string') {
		return { ...obj, extends: [ext] } as T
	}
	return obj
}

export function normalizeLineEndings(value: string): string {
	return value.replace(/\r\n/g, '\n')
}

function getDefaultFilepath(filepath: string, extensions?: string[]): string {
	if (!extensions || extensions.length === 0) return filepath
	const hasExt = extensions.some((ext) => filepath.endsWith(ext))
	return hasExt ? filepath : `${filepath}${extensions[0]}`
}

async function resolveTaskFile(
	cwd: string,
	filepath: string,
	extensions?: string[],
): Promise<string | null> {
	if (extensions) {
		const lastDot = filepath.lastIndexOf('.')
		if (lastDot !== -1) {
			const ext = filepath.slice(lastDot)
			if (extensions.includes(ext)) {
				const base = filepath.slice(0, lastDot)
				return findConfigFile(cwd, base, extensions)
			}
		}
		return findConfigFile(cwd, filepath, extensions)
	}
	return resolvePath(cwd, filepath)
}

// ─── FileTask (text files with optional merge/checkFn) ───

export interface FileTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	filepath: string
	extensions?: string[]
	render: (profile: ProjectProfile, existing: string | null) => string
	merge?: boolean
	depName?: string
	depInstallName?: string
	installDev?: boolean
	ensureParentDir?: boolean
	checkFn?: (
		cwd: string,
		profile: ProjectProfile,
		fullPath: string | null,
		content: string | null,
	) => Promise<TaskStatus>
}

export function createFileTask(options: FileTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const fullPath = await resolveTaskFile(
				cwd,
				options.filepath,
				options.extensions,
			)

			if (!fullPath) return 'new'

			const exists = await fileExists(fullPath)
			if (!exists) return 'new'

			if (options.checkFn) {
				const content = await readFile(fullPath)
				return options.checkFn(cwd, profile, fullPath, content)
			}

			const expected = options.render(profile, null)
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
			const fullPath = await resolveTaskFile(
				cwd,
				options.filepath,
				options.extensions,
			)

			const exists = fullPath !== null && (await fileExists(fullPath))
			const before = exists ? await readFile(fullPath) : null
			const filepath = exists
				? relativeToCwd(fullPath, cwd)
				: getDefaultFilepath(options.filepath, options.extensions)

			const after = options.render(profile, before)

			return [{ filepath, before, after }]
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				const hasDep =
					pkg?.devDependencies?.[options.depName] ||
					pkg?.dependencies?.[options.depName]
				if (!hasDep) {
					await addDependency([options.depInstallName ?? options.depName], {
						cwd,
						dev: options.installDev ?? true,
					})
				}
			}

			if (options.ensureParentDir) {
				const fullPath = resolvePath(cwd, options.filepath)
				await ensureDir(resolvePath(fullPath, '..'))
			}

			const diffs = await this.dryRun(cwd, profile)
			for (const diff of diffs) {
				const fullPath = resolvePath(cwd, diff.filepath)
				await writeFile(fullPath, diff.after)
			}
		},
	}
}

// ─── JsonMergeTask ───

export interface JsonMergeTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	filepath: string
	extensions?: string[]
	incoming: (cwd: string, profile: ProjectProfile) => object | Promise<object>
	depName?: string
	installDev?: boolean
	checkFn?: (
		cwd: string,
		profile: ProjectProfile,
		fullPath: string | null,
		content: string | null,
	) => Promise<TaskStatus>
}

export function createJsonMergeTask(options: JsonMergeTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const fullPath = await resolveTaskFile(
				cwd,
				options.filepath,
				options.extensions,
			)

			if (!fullPath) return 'new'

			const exists = await fileExists(fullPath)
			if (!exists) return 'new'

			if (options.checkFn) {
				const content = await readFile(fullPath)
				return options.checkFn(cwd, profile, fullPath, content)
			}

			const pkg = await readPackageJson(cwd)
			if (options.depName) {
				if (
					!pkg?.devDependencies?.[options.depName] &&
					!pkg?.dependencies?.[options.depName]
				) {
					return 'patch'
				}
			}

			const actual = await readJsonIfExists(fullPath)
			const expected = await options.incoming(cwd, profile)
			const merged = mergeJson(actual ?? {}, expected)
			if (deepEqual(actual, merged)) return 'skip'
			return 'patch'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const fullPath = await resolveTaskFile(
				cwd,
				options.filepath,
				options.extensions,
			)

			const exists = fullPath !== null && (await fileExists(fullPath))
			const before = exists ? await readFile(fullPath) : null
			const filepath = exists
				? relativeToCwd(fullPath, cwd)
				: getDefaultFilepath(options.filepath, options.extensions)

			let after: string
			if (exists && before) {
				const incoming = await options.incoming(cwd, profile)
				const actual = parseJsonc(before)
				const merged = mergeJson(actual ?? {}, incoming)
				after = patchJson(before, merged)
			} else {
				after = JSON.stringify(await options.incoming(cwd, profile), null, 2)
			}

			if (after === before) return []
			return [{ filepath, before, after }]
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				const hasDep =
					pkg?.devDependencies?.[options.depName] ||
					pkg?.dependencies?.[options.depName]
				if (!hasDep) {
					await addDependency([options.depName], {
						cwd,
						dev: options.installDev ?? true,
					})
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

// ─── SimpleFileTask (new files only, skip-if-exists) ───

export interface SimpleFileTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	filepath: string
	extensions?: string[]
	render: (profile: ProjectProfile) => string
	depName?: string
	installDev?: boolean
	ensureParentDir?: boolean
	checkFn?: (
		cwd: string,
		profile: ProjectProfile,
		fullPath: string | null,
		content: string | null,
	) => Promise<TaskStatus>
}

export function createSimpleFileTask(options: SimpleFileTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const fullPath = await resolveTaskFile(
				cwd,
				options.filepath,
				options.extensions,
			)

			if (!fullPath) return 'new'

			const exists = await fileExists(fullPath)
			if (!exists) return 'new'

			if (options.checkFn) {
				const content = await readFile(fullPath)
				return options.checkFn(cwd, profile, fullPath, content)
			}

		const expected = options.render(profile)
		const actual = await readFile(fullPath)
		if (
			normalizeLineEndings(actual.trim()) ===
			normalizeLineEndings(expected.trim())
		)
			return 'skip'
		return 'conflict'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const fullPath = await resolveTaskFile(
				cwd,
				options.filepath,
				options.extensions,
			)

			const exists = fullPath !== null && (await fileExists(fullPath))
			const before = exists ? await readFile(fullPath) : null
			const filepath = exists
				? relativeToCwd(fullPath, cwd)
				: getDefaultFilepath(options.filepath, options.extensions)
			const after = options.render(profile)

			return [{ filepath, before, after }]
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				const hasDep =
					pkg?.devDependencies?.[options.depName] ||
					pkg?.dependencies?.[options.depName]
				if (!hasDep) {
					await addDependency([options.depName], {
						cwd,
						dev: options.installDev ?? true,
					})
				}
			}

			if (options.ensureParentDir) {
				const fullPath = resolvePath(cwd, options.filepath)
				await ensureDir(resolvePath(fullPath, '..'))
			}

			const diffs = await this.dryRun(cwd, profile)
			for (const diff of diffs) {
				const fullPath = resolvePath(cwd, diff.filepath)
				await writeFile(fullPath, diff.after)
			}
		},
	}
}

// ─── MultiFileTask ───

export interface MultiFileEntry {
	filepath: string
	content: (profile: ProjectProfile) => string
}

export interface MultiFileTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	files: (profile: ProjectProfile) => MultiFileEntry[]
	depName?: string
	installDev?: boolean
}

export function createMultiFileTask(options: MultiFileTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const files = options.files(profile)
			let hasMissing = false
			let hasMismatch = false

			for (const f of files) {
				const fullPath = resolvePath(cwd, f.filepath)
				const exists = await fileExists(fullPath)
				if (!exists) {
					hasMissing = true
					continue
				}
				const expected = f.content(profile)
				const actual = await readFile(fullPath)
				if (actual.trim() !== expected.trim()) {
					hasMismatch = true
				}
			}

			if (hasMismatch) return 'conflict'
			if (hasMissing) return 'new'

			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				const hasDep =
					pkg?.devDependencies?.[options.depName] ||
					pkg?.dependencies?.[options.depName]
				if (!hasDep) return 'patch'
			}

			return 'skip'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const files = options.files(profile)
			const diffs: FileDiff[] = []

			for (const f of files) {
				const fullPath = resolvePath(cwd, f.filepath)
				const exists = await fileExists(fullPath)
				const before = exists ? await readFile(fullPath) : null
				const after = f.content(profile)

				if (!exists || before?.trim() !== after.trim()) {
					diffs.push({
						filepath: relativeToCwd(fullPath, cwd),
						before,
						after,
					})
				}
			}

			return diffs
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				const hasDep =
					pkg?.devDependencies?.[options.depName] ||
					pkg?.dependencies?.[options.depName]
				if (!hasDep) {
					await addDependency([options.depName], {
						cwd,
						dev: options.installDev ?? true,
					})
				}
			}

			const diffs = await this.dryRun(cwd, profile)
			for (const diff of diffs) {
				const fullPath = resolvePath(cwd, diff.filepath)
				await ensureDir(resolvePath(fullPath, '..'))
				await writeFile(fullPath, diff.after)
			}
		},
	}
}

// ─── VitePluginTask ───

export interface VitePluginTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	depName: string
	importName: string
	importStyle: 'default' | 'named'
	pluginCall: string
	checkString: string
}

export function createVitePluginTask(options: VitePluginTaskOptions): Task {
	const VITE_CONFIG_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs', '.cjs', '.cts']

	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, _profile): Promise<TaskStatus> {
			const configPath = await findConfigFile(
				cwd,
				'vite.config',
				VITE_CONFIG_EXTENSIONS,
			)
			if (!configPath) return 'conflict'

			const content = await readFile(configPath)
			if (content.includes(options.checkString)) return 'skip'
			return 'new'
		},

		async dryRun(cwd, _profile): Promise<FileDiff[]> {
			const { generateCode, loadFile, parseExpression } = await import(
				'magicast'
			)

			const configPath = await findConfigFile(
				cwd,
				'vite.config',
				VITE_CONFIG_EXTENSIONS,
			)
			if (!configPath) return []

			const before = await readFile(configPath)
			const mod = await loadFile(configPath)

			if (mod.$code.includes(options.checkString)) {
				return [{ filepath: 'vite.config', before, after: before }]
			}

			const defaultExport = mod.exports.default
			if (!defaultExport || !Array.isArray(defaultExport.plugins)) {
				return [{ filepath: 'vite.config', before, after: before }]
			}

			const plugins: unknown[] = defaultExport.plugins as unknown[]
			plugins.push(parseExpression(options.pluginCall))

			const { code: after } = generateCode(mod)
			const importDecl =
				options.importStyle === 'named'
					? `import { ${options.importName} } from '${options.depName}'\n`
					: `import ${options.importName} from '${options.depName}'\n`
			const finalAfter = `${importDecl}${after}`

			return [{ filepath: 'vite.config', before, after: finalAfter }]
		},

		async apply(cwd, _profile): Promise<void> {
			const pkg = await readPackageJson(cwd)
			if (
				!pkg?.devDependencies?.[options.depName] &&
				!pkg?.dependencies?.[options.depName]
			) {
				await addDependency([options.depName], { cwd, dev: true })
			}

			const configPath = await findConfigFile(
				cwd,
				'vite.config',
				VITE_CONFIG_EXTENSIONS,
			)
			if (!configPath) {
				throw new Error(`No vite.config file found for ${options.id}`)
			}

			const importSpecifier =
				options.importStyle === 'named'
					? `{ ${options.importName} }`
					: options.importName

			const result = await injectVitePlugin(
				configPath,
				options.depName,
				importSpecifier,
				options.pluginCall,
			)

			if (!result.success) {
				throw new Error(
					result.fallback ?? `Failed to inject ${options.depName}`,
				)
			}
		},
	}
}

// ─── PackageJsonTask ───

export interface PackageJsonScriptEntry {
	script: string
	value: string
}

export interface PackageJsonTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	scripts?: PackageJsonScriptEntry[]
	getScripts?: (
		cwd: string,
		profile: ProjectProfile,
	) => Promise<PackageJsonScriptEntry[]>
	depName?: string
	installDev?: boolean
	files?: {
		filepath: string
		render: (cwd: string, profile: ProjectProfile) => Promise<string> | string
	}[]
	checkFn?: (
		cwd: string,
		profile: ProjectProfile,
		pkg: Record<string, unknown>,
	) => Promise<TaskStatus>
}

async function resolveScripts(
	options: PackageJsonTaskOptions,
	cwd: string,
	profile: ProjectProfile,
): Promise<PackageJsonScriptEntry[]> {
	if (options.getScripts) return options.getScripts(cwd, profile)
	return options.scripts ?? []
}

type PackageScriptsMap = Record<string, string | undefined>

function hasOwnScript(scripts: PackageScriptsMap, script: string): boolean {
	return Object.hasOwn(scripts, script)
}

function hasScriptValue(scripts: PackageScriptsMap, value: string): boolean {
	return Object.values(scripts).some((v) => v === value)
}

function mergePackageScripts(
	current: PackageScriptsMap | undefined,
	scripts: PackageJsonScriptEntry[],
): PackageScriptsMap {
	const next = { ...current }
	for (const s of scripts) {
		if (!hasOwnScript(next, s.script) && !hasScriptValue(next, s.value)) {
			next[s.script] = s.value
		}
	}
	return next
}

export function createPackageJsonTask(options: PackageJsonTaskOptions): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			const pkg = await readPackageJson(cwd)
			if (!pkg) return 'conflict'

			if (options.checkFn) {
				return options.checkFn(cwd, profile, pkg)
			}

			const scripts = await resolveScripts(options, cwd, profile)
			const scriptsMap = pkg.scripts ?? {}
			const missingScripts = scripts.filter(
				(s) => !hasOwnScript(scriptsMap, s.script),
			)

			const hasDep =
				!options.depName ||
				pkg.devDependencies?.[options.depName] ||
				pkg.dependencies?.[options.depName]

			const extraFiles = options.files ?? []
			const missingFiles: string[] = []
			for (const f of extraFiles) {
				const fullPath = resolvePath(cwd, f.filepath)
				const exists = await fileExists(fullPath)
				if (!exists) missingFiles.push(f.filepath)
			}

			if (missingScripts.length === 0 && hasDep && missingFiles.length === 0)
				return 'skip'
			if (missingScripts.length === 0 && hasDep && missingFiles.length > 0)
				return 'patch'
			if (!hasDep && missingScripts.length === 0 && missingFiles.length === 0)
				return 'patch'
			if (
				missingScripts.length === scripts.length &&
				(!options.depName || !hasDep) &&
				missingFiles.length === extraFiles.length
			)
				return 'new'
			return 'patch'
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const diffs: FileDiff[] = []

			for (const f of options.files ?? []) {
				const fullPath = resolvePath(cwd, f.filepath)
				const exists = await fileExists(fullPath)
				if (exists) continue
				diffs.push({
					filepath: f.filepath,
					before: null,
					after: await f.render(cwd, profile),
				})
			}

			const pkgPath = resolvePath(cwd, 'package.json')
			const pkgExists = await fileExists(pkgPath)
			if (pkgExists) {
				const before = await readFile(pkgPath)
				const pkg = await readPackageJson(cwd)
				if (pkg) {
					const scripts = await resolveScripts(options, cwd, profile)
					const scriptsMap = pkg.scripts ?? {}
					const missingScripts = scripts.filter(
						(s) => !hasOwnScript(scriptsMap, s.script),
					)
					if (missingScripts.length > 0) {
						const incomingScripts: Record<string, string> = {}
						for (const s of missingScripts) {
							incomingScripts[s.script] = s.value
						}
						const after = patchJson(before, { scripts: incomingScripts })
						if (after !== before) {
							diffs.push({ filepath: 'package.json', before, after })
						}
					}
				}
			}

			return diffs
		},

		async apply(cwd, profile): Promise<void> {
			if (options.depName) {
				const pkg = await readPackageJson(cwd)
				if (
					!pkg?.devDependencies?.[options.depName] &&
					!pkg?.dependencies?.[options.depName]
				) {
					await addDependency([options.depName], {
						cwd,
						dev: options.installDev ?? true,
					})
				}
			}

			for (const f of options.files ?? []) {
				const fullPath = resolvePath(cwd, f.filepath)
				const exists = await fileExists(fullPath)
				if (!exists) {
					await writeFile(fullPath, await f.render(cwd, profile))
				}
			}

			const pkg = await readPackageJson(cwd)
			if (pkg) {
				const scripts = await resolveScripts(options, cwd, profile)
				pkg.scripts = mergePackageScripts(pkg.scripts, scripts)
				await writePackageJson(cwd, pkg)
			}
		},
	}
}

// ─── MultiFileJsonMergeTask ───

export interface MultiFileJsonMergeEntry {
	filepath: string
	extensions?: string[]
	incoming: (profile: ProjectProfile) => object | Promise<object>
	merge?: (existing: object, incoming: object) => object
}

export interface MultiFileJsonMergeTaskOptions {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	files: MultiFileJsonMergeEntry[]
}

export function createMultiFileJsonMergeTask(
	options: MultiFileJsonMergeTaskOptions,
): Task {
	return {
		id: options.id,
		label: options.label,
		group: options.group,
		applicable: options.applicable,

		async check(cwd, profile): Promise<TaskStatus> {
			let status: TaskStatus = 'skip'
			for (const f of options.files) {
				const fullPath = await resolveTaskFile(cwd, f.filepath, f.extensions)
				if (!fullPath) {
					status = 'new'
					continue
				}
				const exists = await fileExists(fullPath)
				if (!exists) {
					status = 'new'
					continue
				}
				const actual = await readJsonIfExists(fullPath)
				const expected = await f.incoming(profile)
				const doMerge = f.merge ?? mergeJson
				const merged = doMerge(actual ?? {}, expected)
				if (!deepEqual(actual, merged)) {
					status = 'patch'
				}
			}
			return status
		},

		async dryRun(cwd, profile): Promise<FileDiff[]> {
			const diffs: FileDiff[] = []
			for (const f of options.files) {
				const fullPath = await resolveTaskFile(cwd, f.filepath, f.extensions)
				const exists = fullPath !== null && (await fileExists(fullPath))
				const before = exists ? await readFile(fullPath) : null
				const filepath = exists ? relative(cwd, fullPath) : f.filepath

				let after: string
				if (exists && before) {
					const incoming = await f.incoming(profile)
					const actual = parseJsonc(before)
					const doMerge = f.merge ?? mergeJson
					const merged = doMerge(actual ?? {}, incoming)
					after = patchJson(before, merged)
				} else {
					after = JSON.stringify(await f.incoming(profile), null, 2)
				}

				if (!exists || after !== before) {
					diffs.push({ filepath, before, after })
				}
			}
			return diffs
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
