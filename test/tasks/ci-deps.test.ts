import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectProject } from '@xtarterize/core'
import { ciWorkflowTask, autoUpdateWorkflowTask, releaseWorkflowTask, renovateTask } from '@xtarterize/tasks'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('ciWorkflowTask', () => {
	it('is applicable when hasGitHub is true', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		// The fixture does not have .github, but hasGit checks for .github dir
		expect(ciWorkflowTask.applicable(profile)).toBe(profile.hasGitHub)
	})
})

describe('autoUpdateWorkflowTask', () => {
	it('is applicable when hasGitHub is true', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(autoUpdateWorkflowTask.applicable(profile)).toBe(profile.hasGitHub)
	})
})

describe('releaseWorkflowTask', () => {
	it('is applicable when hasGitHub is true', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(releaseWorkflowTask.applicable(profile)).toBe(profile.hasGitHub)
	})
})

describe('renovateTask', () => {
	it('is applicable when hasGitHub is true', async () => {
		const profile = await detectProject(
			path.join(fixtures, 'react-vite-tailwind'),
		)
		expect(renovateTask.applicable(profile)).toBe(profile.hasGitHub)
	})
})
