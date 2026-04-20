import type { FileDiff, ProjectProfile, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readJsonIfExists,
	resolvePath,
	writeFile,
} from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
import { renderVscodeExtensions } from '../templates/vscode/extensions.js'
import { renderVscodeSettings } from '../templates/vscode/settings.js'

export const vscodeTask: Task = {
	id: 'editor/vscode',
	label: 'VSCode settings + extensions',
	group: 'Editor',
	applicable: () => true,

	async check(cwd, profile): Promise<TaskStatus> {
		const [settingsPath, extensionsPath] = [
			resolvePath(cwd, '.vscode', 'settings.json'),
			resolvePath(cwd, '.vscode', 'extensions.json'),
		]
		const [settingsExists, extensionsExists] = await Promise.all([
			fileExists(settingsPath),
			fileExists(extensionsPath),
		])

		if (!settingsExists && !extensionsExists) return 'new'

		let anyPatch = false
		if (settingsExists) {
			const existing = await readJsonIfExists(settingsPath)
			const incoming = JSON.parse(renderVscodeSettings(profile))
			const merged = mergeJson(existing ?? {}, incoming)
			if (JSON.stringify(existing) !== JSON.stringify(merged)) anyPatch = true
		}
		if (extensionsExists) {
			const existing = await readJsonIfExists(extensionsPath)
			const incoming = JSON.parse(renderVscodeExtensions(profile))
			const merged = mergeJson(existing ?? {}, incoming)
			if (JSON.stringify(existing) !== JSON.stringify(merged)) anyPatch = true
		}

		return anyPatch ? 'patch' : 'skip'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const diffs: FileDiff[] = []

		const settingsPath = resolvePath(cwd, '.vscode', 'settings.json')
		const settingsExists = await fileExists(settingsPath)
		const settingsBefore = settingsExists ? await readFile(settingsPath) : null
		let settingsAfter: string
		if (settingsExists && settingsBefore) {
			const existing = JSON.parse(settingsBefore)
			const incoming = JSON.parse(renderVscodeSettings(profile))
			settingsAfter = JSON.stringify(mergeJson(existing, incoming), null, 2)
		} else {
			settingsAfter = renderVscodeSettings(profile)
		}
		diffs.push({ filepath: '.vscode/settings.json', before: settingsBefore, after: settingsAfter })

		const extensionsPath = resolvePath(cwd, '.vscode', 'extensions.json')
		const extensionsExists = await fileExists(extensionsPath)
		const extensionsBefore = extensionsExists ? await readFile(extensionsPath) : null
		let extensionsAfter: string
		if (extensionsExists && extensionsBefore) {
			const existing = JSON.parse(extensionsBefore)
			const incoming = JSON.parse(renderVscodeExtensions(profile))
			extensionsAfter = JSON.stringify(mergeJson(existing, incoming), null, 2)
		} else {
			extensionsAfter = renderVscodeExtensions(profile)
		}
		diffs.push({ filepath: '.vscode/extensions.json', before: extensionsBefore, after: extensionsAfter })

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
