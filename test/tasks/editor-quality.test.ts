import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectProject } from '@xtarterize/core'
import { knipTask, vscodeTask, agentsMdTask, skillsTask, turboTask } from '@xtarterize/tasks'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('knipTask', () => {
	it('is applicable to TS projects only', async () => {
		const tsProfile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(knipTask.applicable(tsProfile)).toBe(true)

		const nonTsProfile = await detectProject(
			path.join(fixtures, 'monorepo-turbo'),
		)
		expect(knipTask.applicable(nonTsProfile)).toBe(false)
	})

	it('returns new on clean fixture', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const status = await knipTask.check(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(status).toBe('new')
	})
})

describe('vscodeTask', () => {
	it('is applicable to all projects', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(vscodeTask.applicable(profile)).toBe(true)
	})

	it('dryRun returns settings and extensions diffs', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const diffs = await vscodeTask.dryRun(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(diffs.length).toBe(2)
		expect(diffs.some((d) => d.filepath.includes('settings.json'))).toBe(true)
		expect(diffs.some((d) => d.filepath.includes('extensions.json'))).toBe(true)
	})
})

describe('agentsMdTask', () => {
	it('is applicable to all projects', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(agentsMdTask.applicable(profile)).toBe(true)
	})

	it('returns new when AGENTS.md is missing', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const status = await agentsMdTask.check(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(status).toBe('new')
	})
})

describe('skillsTask', () => {
	it('is applicable to TS projects only', async () => {
		const tsProfile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(skillsTask.applicable(tsProfile)).toBe(true)

		const nonTsProfile = await detectProject(
			path.join(fixtures, 'monorepo-turbo'),
		)
		expect(skillsTask.applicable(nonTsProfile)).toBe(false)
	})
})

describe('turboTask', () => {
	it('is applicable to monorepos only', async () => {
		const monoProfile = await detectProject(
			path.join(fixtures, 'monorepo-turbo'),
		)
		expect(turboTask.applicable(monoProfile)).toBe(true)

		const nonMonoProfile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(turboTask.applicable(nonMonoProfile)).toBe(false)
	})
})
