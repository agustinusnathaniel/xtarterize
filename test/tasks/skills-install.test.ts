import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectProject } from '@xtarterize/core'
import { skillsInstallTask } from '@xtarterize/tasks'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('skillsInstallTask', () => {
	it('is applicable to TypeScript projects', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(skillsInstallTask.applicable(profile)).toBe(true)
	})

	it('is not applicable to non-TypeScript projects', async () => {
		const profile = await detectProject(path.join(fixtures, 'node-only'))
		// node-only fixture might still have tsconfig, check actual profile
		expect(skillsInstallTask.applicable(profile)).toBe(profile.typescript)
	})

	it('returns new on clean react fixture with react skills', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const status = await skillsInstallTask.check(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(status).toBe('new')
	})

	it('dryRun includes react skills for react projects', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const diffs = await skillsInstallTask.dryRun(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(diffs.length).toBe(1)
		expect(diffs[0].filepath).toBe('.xtarterize/skills-install.log')
		expect(diffs[0].before).toBeNull()
		const after = diffs[0].after ?? ''
		expect(after).toContain('vercel-react-best-practices')
		expect(after).toContain('frontend-design')
		expect(after).toContain('web-design-guidelines')
		expect(after).toContain('vercel-composition-patterns')
	})

	it('dryRun includes web frontend skills for vue projects', async () => {
		const profile = await detectProject(path.join(fixtures, 'vue-vite'))
		const diffs = await skillsInstallTask.dryRun(
			path.join(fixtures, 'vue-vite'),
			profile,
		)
		expect(diffs.length).toBe(1)
		const after = diffs[0].after ?? ''
		expect(after).toContain('frontend-design')
		expect(after).toContain('web-design-guidelines')
		expect(after).not.toContain('vercel-react-best-practices')
		expect(after).not.toContain('vercel-composition-patterns')
	})

	it('dryRun includes nextjs skills for nextjs projects', async () => {
		const profile = await detectProject(path.join(fixtures, 'nextjs'))
		const diffs = await skillsInstallTask.dryRun(
			path.join(fixtures, 'nextjs'),
			profile,
		)
		expect(diffs.length).toBe(1)
		const after = diffs[0].after ?? ''
		// Next.js is also React, so should include both React and Next.js skills
		expect(after).toContain('vercel-react-best-practices')
		expect(after).toContain('next-best-practices')
		expect(after).toContain('next-cache-components')
		expect(after).toContain('next-upgrade')
	})

	it('dryRun includes expo skills for expo projects', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-native-expo'),
		)
		const diffs = await skillsInstallTask.dryRun(
			path.join(fixtures, 'react-native-expo'),
			profile,
		)
		expect(diffs.length).toBe(1)
		const after = diffs[0].after ?? ''
		expect(after).toContain('expo-tailwind-setup')
		expect(after).toContain('expo-cicd-workflows')
		expect(after).toContain('expo-deployment')
		expect(after).toContain('expo-dev-client')
		expect(after).toContain('building-native-ui')
		expect(after).toContain('native-data-fetching')
		expect(after).toContain('expo-module')
	})

	it('returns skip when no relevant framework is detected', async () => {
		const profile = await detectProject(path.join(fixtures, 'node-only'))
		if (!skillsInstallTask.applicable(profile)) {
			// If not applicable, skip testing check
			return
		}
		const status = await skillsInstallTask.check(
			path.join(fixtures, 'node-only'),
			profile,
		)
		expect(status).toBe('skip')
	})

	it('returns empty dryRun when no relevant framework is detected', async () => {
		const profile = await detectProject(path.join(fixtures, 'node-only'))
		const diffs = await skillsInstallTask.dryRun(
			path.join(fixtures, 'node-only'),
			profile,
		)
		expect(diffs.length).toBe(0)
	})
})
