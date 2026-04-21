import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectProject } from '@xtarterize/core'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('detectProject', () => {
	it('detects react-vite-tailwind correctly', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(profile.framework).toBe('react')
		expect(profile.frameworkVersion).toBe('18.2.0')
		expect(profile.bundler).toBe('vite')
		expect(profile.router).toBeNull()
		expect(profile.styling).toContain('tailwind')
		expect(profile.runtime).toBe('browser')
		expect(profile.packageManager).toBe('pnpm')
		expect(profile.typescript).toBe(true)
		expect(profile.vitePlus).toBe(false)
		expect(profile.monorepo).toBe(false)
		expect(profile.monorepoTool).toBeNull()
		expect(profile.workspaceRoot).toBe(false)
		expect(profile.hasGitHub).toBe(false)
		expect(profile.hasGit).toBe(true)
		expect(profile.existing.tsconfig).toBe(true)
		expect(profile.existing.viteConfig).toBe(true)
		expect(profile.existing.biome).toBe(false)
		expect(profile.existing.gitignore).toBe(false)
	})

	it('detects react-vite-no-styling correctly', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-no-styling'),
		)
		expect(profile.framework).toBe('react')
		expect(profile.bundler).toBe('vite')
		expect(profile.router).toBeNull()
		expect(profile.styling).toContain('vanilla')
		expect(profile.runtime).toBe('browser')
		expect(profile.packageManager).toBe('npm')
		expect(profile.typescript).toBe(true)
		expect(profile.vitePlus).toBe(false)
		expect(profile.hasGit).toBe(false)
		expect(profile.hasGitHub).toBe(false)
	})

	it('detects vue-vite correctly', async () => {
		const profile = await detectProject(path.join(fixtures, 'vue-vite'))
		expect(profile.framework).toBe('vue')
		expect(profile.frameworkVersion).toBe('3.4.0')
		expect(profile.bundler).toBe('vite')
		expect(profile.router).toBeNull()
		expect(profile.runtime).toBe('browser')
		expect(profile.packageManager).toBe('pnpm')
		expect(profile.typescript).toBe(true)
		expect(profile.vitePlus).toBe(false)
		expect(profile.hasGit).toBe(false)
	})

	it('detects nextjs correctly', async () => {
		const profile = await detectProject(path.join(fixtures, 'nextjs'))
		expect(profile.framework).toBe('react')
		expect(profile.frameworkVersion).toBe('18.2.0')
		expect(profile.bundler).toBe('nextjs')
		expect(profile.router).toBe('next')
		expect(profile.runtime).toBe('edge')
		expect(profile.packageManager).toBe('pnpm')
		expect(profile.typescript).toBe(true)
		expect(profile.vitePlus).toBe(false)
		expect(profile.hasGit).toBe(false)
	})

	it('detects react-native-expo correctly', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-native-expo'),
		)
		// Framework is null because both react and react-native are present (ambiguous)
		// CLI layer should prompt for clarification
		expect(profile.framework).toBe(null)
		expect(profile.bundler).toBe('expo')
		expect(profile.router).toBe('expo-router')
		// runtime is browser because framework is null (ambiguous) and bundler is expo
		expect(profile.runtime).toBe('browser')
		expect(profile.packageManager).toBe('yarn')
		expect(profile.styling).toContain('vanilla')
		expect(profile.typescript).toBe(true)
		expect(profile.vitePlus).toBe(false)
		expect(profile.hasGit).toBe(false)
	})

	it('detects node-only correctly', async () => {
		const profile = await detectProject(path.join(fixtures, 'node-only'))
		expect(profile.framework).toBe('node')
		expect(profile.frameworkVersion).toBeNull()
		expect(profile.bundler).toBe('none')
		expect(profile.router).toBeNull()
		expect(profile.runtime).toBe('node')
		expect(profile.packageManager).toBe('pnpm')
		expect(profile.typescript).toBe(true)
		expect(profile.vitePlus).toBe(false)
		expect(profile.hasGit).toBe(false)
	})

	it('detects monorepo-turbo correctly', async () => {
		const profile = await detectProject(path.join(fixtures, 'monorepo-turbo'))
		expect(profile.monorepo).toBe(true)
		expect(profile.monorepoTool).toBe('turbo')
		expect(profile.workspaceRoot).toBe(true)
		expect(profile.framework).toBe('node')
		expect(profile.bundler).toBe('none')
		expect(profile.runtime).toBe('node')
		expect(profile.packageManager).toBe('pnpm')
		expect(profile.typescript).toBe(false)
		expect(profile.vitePlus).toBe(false)
		expect(profile.hasGit).toBe(false)
	})
})
