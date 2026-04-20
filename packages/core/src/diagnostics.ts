import { x } from 'tinyexec'
import { fileExists, resolvePath } from './utils/fs.js'
import { readPackageJson } from './utils/pkg.js'

export interface DiagnosticCheck {
	name: string
	status: 'pass' | 'warn' | 'fail'
	message: string
}

export async function checkToolInstalled(
	tool: string,
	cwd: string,
): Promise<boolean> {
	try {
		const result = await x(tool, ['--version'], { nodeOptions: { cwd } })
		return result.exitCode === 0
	} catch {
		return false
	}
}

export async function runConflictChecks(
	cwd: string,
): Promise<DiagnosticCheck[]> {
	const checks: DiagnosticCheck[] = []
	const pkg = await readPackageJson(cwd)
	if (!pkg) return checks

	const deps = { ...pkg.dependencies, ...pkg.devDependencies }

	// Check for Biome + ESLint conflict
	const hasBiome = !!deps['@biomejs/biome']
	const hasEslint = !!deps.eslint
	const hasPrettier = !!deps.prettier

	if (hasBiome && hasEslint) {
		checks.push({
			name: 'Conflicting tools',
			status: 'warn',
			message:
				'Both Biome and ESLint are configured. Consider using one as primary.',
		})
	}

	if (hasBiome && hasPrettier) {
		checks.push({
			name: 'Conflicting tools',
			status: 'warn',
			message:
				'Both Biome and Prettier are configured. Biome includes formatting — Prettier may be redundant.',
		})
	}

	// Check for legacy ESLint config files
	const legacyEslintConfigs = [
		'.eslintrc',
		'.eslintrc.js',
		'.eslintrc.cjs',
		'.eslintrc.mjs',
		'.eslintrc.json',
		'.eslintrc.yaml',
		'.eslintrc.yml',
	]
	for (const config of legacyEslintConfigs) {
		if (await fileExists(resolvePath(cwd, config))) {
			checks.push({
				name: 'Legacy config',
				status: 'warn',
				message: `Legacy ESLint config found (${config}). Consider migrating to flat config (eslint.config.js).`,
			})
			break
		}
	}

	if (checks.length === 0) {
		checks.push({
			name: 'Conflicting tools',
			status: 'pass',
			message: 'No conflicting formatting/linting tools detected.',
		})
	}

	return checks
}

export async function runToolInstallationChecks(
	cwd: string,
): Promise<DiagnosticCheck[]> {
	const checks: DiagnosticCheck[] = []
	const pkg = await readPackageJson(cwd)
	if (!pkg) return checks

	const deps = { ...pkg.dependencies, ...pkg.devDependencies }

	const toolsToCheck: {
		name: string
		dep: string
		required: boolean
		cmd?: string
	}[] = [
		{ name: 'Biome', dep: '@biomejs/biome', required: false, cmd: 'biome' },
		{ name: 'ESLint', dep: 'eslint', required: false, cmd: 'eslint' },
		{ name: 'TypeScript', dep: 'typescript', required: false, cmd: 'tsc' },
		{
			name: 'Commitlint',
			dep: '@commitlint/cli',
			required: false,
			cmd: 'commitlint',
		},
		{ name: 'Knip', dep: 'knip', required: false, cmd: 'knip' },
	]

	for (const tool of toolsToCheck) {
		if (deps[tool.dep]) {
			const cmd = tool.cmd ?? tool.name.toLowerCase()
			const installed = await checkToolInstalled(cmd, cwd)
			checks.push({
				name: `${tool.name} installation`,
				status: installed ? 'pass' : tool.required ? 'fail' : 'warn',
				message: installed
					? `${tool.name} is installed`
					: `${tool.name} is in package.json but not installed (run install)`,
			})
		}
	}

	return checks
}
