import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectProject } from '@xtarterize/core'
import { gitignoreTsbuildinfoTask, incrementalTask } from '@xtarterize/tasks'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('gitignoreTsbuildinfoTask', () => {
	it('is applicable to TS projects only', async () => {
		const tsProfile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(gitignoreTsbuildinfoTask.applicable(tsProfile)).toBe(true)

		const nonTsProfile = await detectProject(
			path.join(fixtures, 'monorepo-turbo'),
		)
		expect(gitignoreTsbuildinfoTask.applicable(nonTsProfile)).toBe(false)
	})

	it('returns new when .gitignore is missing', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const status = await gitignoreTsbuildinfoTask.check(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(status).toBe('new')
	})

	it('dryRun returns correct content', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const diffs = await gitignoreTsbuildinfoTask.dryRun(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(diffs.length).toBe(1)
		expect(diffs[0].filepath).toBe('.gitignore')
		expect(diffs[0].before).toBeNull()
		expect(diffs[0].after).toContain('.tsbuildinfo')
	})
})

describe('incrementalTask', () => {
	it('is applicable to TS projects only', async () => {
		const tsProfile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(incrementalTask.applicable(tsProfile)).toBe(true)
	})

	it('returns patch when incremental is missing', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const status = await incrementalTask.check(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(status).toBe('patch')
	})

	it('dryRun returns correct diff', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		const diffs = await incrementalTask.dryRun(
			path.join(fixtures, 'react-vite-tailwind'),
			profile,
		)
		expect(diffs.length).toBe(1)
		expect(diffs[0].after).toContain('incremental')
	})
})
