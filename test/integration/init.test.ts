import { describe, it, expect } from 'vitest'
import { detectProject } from '@xtarterize/core'
import { resolveTasks, resolveTaskStatuses } from '@xtarterize/core'
import { getAllTasks } from '@xtarterize/tasks'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const testDir = path.join(fixtures, 'react-vite-tailwind')

describe('init integration', () => {
  it('runs full init on react-vite-tailwind', async () => {
    const profile = await detectProject(testDir)
    expect(profile.framework).toBe('react')
    expect(profile.bundler).toBe('vite')

    const allTasks = getAllTasks()
    const tasks = resolveTasks(profile, allTasks)
    expect(tasks.length).toBeGreaterThan(0)

    const statuses = await resolveTaskStatuses(tasks, testDir, profile)

    const actionableTasks = tasks.filter(t => {
      const status = statuses.get(t.id)
      return status === 'new' || status === 'patch'
    })

    expect(actionableTasks.length).toBeGreaterThan(0)
  })
})
