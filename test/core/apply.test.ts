import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyTasks, detectProject } from '@xtarterize/core'
import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('applyTasks', () => {
	it('applies a single task successfully', async () => {
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xtarterize-apply-'))
		await fs.writeFile(
			path.join(tmpDir, 'package.json'),
			JSON.stringify({ name: 'test', version: '1.0.0' }),
		)

		const profile = await detectProject(tmpDir)
		const mockTask = {
			id: 'mock/task',
			label: 'Mock Task',
			group: 'Test',
			applicable: () => true,
			check: async () => 'new' as const,
			dryRun: async () => [{ filepath: 'test.txt', before: null, after: 'hello' }],
			apply: async () => {
				await fs.writeFile(path.join(tmpDir, 'test.txt'), 'hello')
			},
		}

		const result = await applyTasks([mockTask], tmpDir, profile)
		expect(result.errors).toHaveLength(0)
		expect(result.applied).toBe(1)

		await fs.rm(tmpDir, { recursive: true })
	})

	it('skips tasks that are already applied', async () => {
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xtarterize-skip-'))
		await fs.writeFile(
			path.join(tmpDir, 'package.json'),
			JSON.stringify({ name: 'test', version: '1.0.0' }),
		)
		await fs.writeFile(path.join(tmpDir, 'test.txt'), 'hello')

		const profile = await detectProject(tmpDir)
		const mockTask = {
			id: 'mock/task',
			label: 'Mock Task',
			group: 'Test',
			applicable: () => true,
			check: async () => 'skip' as const,
			dryRun: async () => [{ filepath: 'test.txt', before: 'hello', after: 'hello' }],
			apply: async () => {},
		}

		const result = await applyTasks([mockTask], tmpDir, profile)
		expect(result.skipped).toBe(1)
		expect(result.applied).toBe(0)

		await fs.rm(tmpDir, { recursive: true })
	})
})
