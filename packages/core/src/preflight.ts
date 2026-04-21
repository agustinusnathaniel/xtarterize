import { fileExists, resolvePath } from '@/utils/fs.js'
import { readPackageJson } from '@/utils/pkg.js'

export interface PreflightError {
	code: string
	message: string
	hint?: string
}

export interface PreflightResult {
	valid: boolean
	errors: PreflightError[]
}

export async function runPreflight(cwd: string): Promise<PreflightResult> {
	const errors: PreflightError[] = []

	const hasPackageJson = await fileExists(resolvePath(cwd, 'package.json'))
	if (!hasPackageJson) {
		errors.push({
			code: 'MISSING_PACKAGE_JSON',
			message: 'No package.json found',
			hint: 'Run xtarterize init from the root of a JS/TS project.',
		})
		return { valid: false, errors }
	}

	const pkg = await readPackageJson(cwd)
	if (!pkg?.name) {
		errors.push({
			code: 'INVALID_PACKAGE_JSON',
			message: 'package.json is missing a "name" field',
			hint: 'Add a "name" field to your package.json and try again.',
		})
		return { valid: false, errors }
	}

	const hasGit = await fileExists(resolvePath(cwd, '.git'))
	if (!hasGit) {
		errors.push({
			code: 'MISSING_GIT',
			message: 'No .git directory found',
			hint: 'Initialize a git repository with "git init" before running xtarterize.',
		})
	}

	return { valid: errors.length === 0, errors }
}
