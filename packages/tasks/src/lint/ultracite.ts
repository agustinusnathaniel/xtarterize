import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson } from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

export const ultraciteTask: Task = {
  id: 'lint/ultracite',
  label: 'Ultracite preset',
  group: 'Linting & Formatting',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const biomePath = resolvePath(cwd, 'biome.json')
    const exists = await fileExists(biomePath)
    if (!exists) return 'conflict'

    const content = await readFile(biomePath)
    const parsed = JSON.parse(content)
    if (parsed.extends?.includes('ultracite')) {
      const pkg = await readPackageJson(cwd)
      if (pkg?.devDependencies?.['ultracite']) return 'skip'
    }

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const biomePath = resolvePath(cwd, 'biome.json')
    const exists = await fileExists(biomePath)
    const before = exists ? await readFile(biomePath) : null
    const existing = before ? JSON.parse(before) : {}
    const incoming = { extends: ['ultracite'] }
    const merged = mergeJson(existing, incoming)
    const after = JSON.stringify(merged, null, 2)

    return [{ filepath: 'biome.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['ultracite']) {
      await addDependency(['ultracite'], { cwd, dev: true })
    }

    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
