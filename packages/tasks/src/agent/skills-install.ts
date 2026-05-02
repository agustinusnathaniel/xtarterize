import type {
	FileDiff,
	ProjectProfile,
	Task,
	TaskStatus,
} from '@xtarterize/core'
import {
	fileExists,
	readFile,
	readPackageJson,
	resolvePath,
} from '@xtarterize/core'
import { x } from 'tinyexec'

interface SkillEntry {
	source: string
	skill: string
}

function getAllDeps(pkg: Record<string, unknown>): Record<string, string> {
	const deps: Record<string, string> = {}
	if (
		typeof pkg.dependencies === 'object' &&
		pkg.dependencies !== null &&
		!Array.isArray(pkg.dependencies)
	) {
		Object.assign(deps, pkg.dependencies as Record<string, string>)
	}
	if (
		typeof pkg.devDependencies === 'object' &&
		pkg.devDependencies !== null &&
		!Array.isArray(pkg.devDependencies)
	) {
		Object.assign(deps, pkg.devDependencies as Record<string, string>)
	}
	return deps
}

function getSkillsToInstall(
	profile: ProjectProfile,
	deps: Record<string, string>,
): SkillEntry[] {
	const skills: SkillEntry[] = []

	// Frontend design skills apply to all web frontend projects
	const isWebFrontend =
		profile.runtime === 'browser' || profile.runtime === 'edge'
	if (isWebFrontend) {
		skills.push(
			{ source: 'anthropics/skills', skill: 'frontend-design' },
			{
				source: 'vercel-labs/agent-skills',
				skill: 'web-design-guidelines',
			},
		)
	}

	// React-specific skills (includes Next.js since framework === 'react' for Next)
	if (profile.framework === 'react') {
		skills.push(
			{
				source: 'vercel-labs/agent-skills',
				skill: 'vercel-react-best-practices',
			},
			{
				source: 'vercel-labs/agent-skills',
				skill: 'vercel-composition-patterns',
			},
		)
	}

	// Next.js skills
	if (profile.bundler === 'nextjs') {
		skills.push(
			{
				source: 'vercel-labs/next-skills',
				skill: 'next-best-practices',
			},
			{
				source: 'vercel-labs/next-skills',
				skill: 'next-cache-components',
			},
			{ source: 'vercel-labs/next-skills', skill: 'next-upgrade' },
		)
	}

	// Shadcn detection via components.json or deps
	const hasShadcn =
		deps.shadcn ||
		deps['shadcn-ui'] ||
		deps['@shadcn/ui'] ||
		deps['@shadcn-ui/cli']
	if (hasShadcn) {
		skills.push({ source: 'shadcn/ui', skill: 'shadcn' })
	}

	// Ultracite detection
	if (deps.ultracite) {
		skills.push({ source: 'haydenbleasel/ultracite', skill: 'ultracite' })
	}

	// Expo / React Native skills
	if (profile.bundler === 'expo' || profile.framework === 'react-native') {
		skills.push(
			{ source: 'expo/skills', skill: 'expo-tailwind-setup' },
			{ source: 'expo/skills', skill: 'expo-cicd-workflows' },
			{ source: 'expo/skills', skill: 'expo-deployment' },
			{ source: 'expo/skills', skill: 'expo-dev-client' },
			{ source: 'expo/skills', skill: 'building-native-ui' },
			{ source: 'expo/skills', skill: 'native-data-fetching' },
			{ source: 'expo/skills', skill: 'expo-module' },
		)
	}

	return skills
}

async function readSkillLockFile(lockPath: string): Promise<Set<string>> {
	const installed = new Set<string>()
	if (!(await fileExists(lockPath))) return installed

	try {
		const content = await readFile(lockPath)
		const lock = JSON.parse(content) as {
			skills?: Record<string, unknown>
		}
		if (lock.skills && typeof lock.skills === 'object') {
			for (const name of Object.keys(lock.skills)) {
				installed.add(name)
			}
		}
	} catch {
		// ignore parse errors
	}

	return installed
}

async function isDirNonEmpty(dirPath: string): Promise<boolean> {
	try {
		const { readdir } = await import('node:fs/promises')
		const entries = await readdir(dirPath)
		return entries.length > 0
	} catch {
		return false
	}
}

async function readSkillsFromDir(skillsDir: string): Promise<Set<string>> {
	const installed = new Set<string>()
	if (!(await fileExists(skillsDir))) return installed

	try {
		const { readdir } = await import('node:fs/promises')
		const entries = await readdir(skillsDir, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const skillPath = resolvePath(skillsDir, entry.name)
				const hasContent = await isDirNonEmpty(skillPath)
				if (hasContent) {
					installed.add(entry.name)
				}
			}
		}
	} catch {
		// ignore read errors
	}

	return installed
}

async function getInstalledSkills(cwd: string): Promise<Set<string>> {
	// Check project-local skill directories first
	const projectDirs = [
		resolvePath(cwd, '.agents', 'skills'),
		resolvePath(cwd, '.claude', 'skills'),
		resolvePath(cwd, '.cursor', 'skills'),
	]

	const dirSkills = new Set<string>()
	for (const dir of projectDirs) {
		const skills = await readSkillsFromDir(dir)
		for (const s of skills) dirSkills.add(s)
	}

	// Validate lock file entries against actual directories
	const lockPath = resolvePath(cwd, 'skills-lock.json')
	const lockSkills = await readSkillLockFile(lockPath)

	const installed = new Set<string>()
	for (const s of lockSkills) {
		if (dirSkills.has(s)) {
			installed.add(s)
		}
	}
	// Also include any directory skills not in lock file
	for (const s of dirSkills) {
		installed.add(s)
	}

	return installed
}

function formatCommands(skills: SkillEntry[]): string {
	return skills
		.map((s) => `npx skills@latest add ${s.source} --skill ${s.skill}`)
		.join('\n')
}

export const skillsInstallTask: Task = {
	id: 'agent/skills-install',
	label: 'Install agent skills',
	group: 'Agent',

	applicable: (profile) => profile.typescript,

	async check(cwd, profile): Promise<TaskStatus> {
		const pkg = await readPackageJson(cwd)
		const deps = pkg ? getAllDeps(pkg as Record<string, unknown>) : {}
		const skills = getSkillsToInstall(profile, deps)

		if (skills.length === 0) return 'skip'

		const installed = await getInstalledSkills(cwd)
		const missing = skills.filter((s) => !installed.has(s.skill))

		if (missing.length === 0) return 'skip'
		if (missing.length === skills.length) return 'new'
		return 'patch'
	},

	async dryRun(cwd, profile): Promise<FileDiff[]> {
		const pkg = await readPackageJson(cwd)
		const deps = pkg ? getAllDeps(pkg as Record<string, unknown>) : {}
		const skills = getSkillsToInstall(profile, deps)

		if (skills.length === 0) return []

		const installed = await getInstalledSkills(cwd)
		const missing = skills.filter((s) => !installed.has(s.skill))

		if (missing.length === 0) return []

		return [
			{
				filepath: '.xtarterize/skills-install.log',
				before: null,
				after: `# Skills to install (${missing.length} of ${skills.length}):\n${formatCommands(missing)}\n`,
			},
		]
	},

	async apply(cwd, profile): Promise<void> {
		const pkg = await readPackageJson(cwd)
		const deps = pkg ? getAllDeps(pkg as Record<string, unknown>) : {}
		const skills = getSkillsToInstall(profile, deps)

		if (skills.length === 0) return

		const installed = await getInstalledSkills(cwd)
		const missing = skills.filter((s) => !installed.has(s.skill))

		for (const { source, skill } of missing) {
			const result = await x(
				'npx',
				['skills@latest', 'add', source, '--skill', skill, '-y'],
				{ nodeOptions: { cwd, stdio: 'inherit' } },
			)
			if (result.exitCode !== 0) {
				throw new Error(`Failed to install skill ${skill}`)
			}
		}
	},
}
