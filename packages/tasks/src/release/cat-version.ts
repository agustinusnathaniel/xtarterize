import type { FileDiff, Task, TaskStatus } from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readPackageJson,
	resolvePath,
	writeFile,
	writePackageJson,
} from '@xtarterize/core'
import { addDependency } from 'nypm'

const VERSIONRC_TEMPLATE = `{
  "packageFiles": ["package.json"],
  "bumpFiles": ["package.json"],
  "types": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "chore", "hidden": true },
    { "type": "docs", "section": "Documentation" },
    { "type": "style", "hidden": true },
    { "type": "refactor", "section": "Refactors" },
    { "type": "perf", "section": "Performance" },
    { "type": "test", "hidden": true }
  ]
}`

export const catVersionTask: Task = {
	id: 'release/cat-version',
	label: 'commit-and-tag-version',
	group: 'Release',
	applicable: () => true,

	async check(cwd, _profile): Promise<TaskStatus> {
		const versionrcPaths = ['.versionrc', '.versionrc.json', '.versionrc.js']
		const hasVersionrc = versionrcPaths.some((p) => fileExists(resolvePath(cwd, p)))

		const pkg = await readPackageJson(cwd)
		const hasCatVersion = pkg?.devDependencies?.['commit-and-tag-version']
		const hasReleaseScript = pkg?.scripts?.release?.includes(
			'commit-and-tag-version',
		)

		if (hasVersionrc && hasCatVersion && hasReleaseScript) return 'skip'
		if (!hasVersionrc && !hasCatVersion) return 'new'
		return 'patch'
	},

	async dryRun(cwd, _profile): Promise<FileDiff[]> {
		const diffs: FileDiff[] = []

		const versionrcPath = resolvePath(cwd, '.versionrc')
		const versionrcExists = await fileExists(versionrcPath)
		const versionrcBefore = versionrcExists
			? await readFile(versionrcPath)
			: null
		diffs.push({
			filepath: '.versionrc',
			before: versionrcBefore,
			after: VERSIONRC_TEMPLATE,
		})

		const pkg = await readPackageJson(cwd)
		if (pkg) {
			const before = JSON.stringify(pkg, null, 2)
			const updated = { ...pkg }
			updated.scripts = {
				...updated.scripts,
				release: 'commit-and-tag-version',
			}
			const after = JSON.stringify(updated, null, 2)
			diffs.push({ filepath: 'package.json', before, after })
		}

		return diffs
	},

	async apply(cwd, _profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		if (!pkg) return

		const versionrcVariants = ['.versionrc', '.versionrc.json', '.versionrc.js']
		const existingVersionrc = versionrcVariants.find((p) => fileExists(resolvePath(cwd, p)))
		const versionrcPath = existingVersionrc
			? resolvePath(cwd, existingVersionrc)
			: resolvePath(cwd, '.versionrc')

		const versionrcExists = existingVersionrc !== undefined
		if (!versionrcExists) {
			await writeFile(versionrcPath, VERSIONRC_TEMPLATE)
		}

		if (!pkg.devDependencies?.['commit-and-tag-version']) {
			await addDependency(['commit-and-tag-version'], { cwd, dev: true })
		}

		const updatedPkg = await readPackageJson(cwd)
		if (updatedPkg) {
			updatedPkg.scripts = { ...updatedPkg.scripts, release: 'commit-and-tag-version' }
			await writePackageJson(cwd, updatedPkg)
		}
	},
}
