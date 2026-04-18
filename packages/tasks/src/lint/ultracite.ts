import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson } from '@xtarterize/core'
import { mergeJson, parseJsonc } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

function findBiomeConfigPath(cwd: string): Promise<{ path: string | null; isJsonc: boolean }> {
  return Promise.all([
    fileExists(resolvePath(cwd, 'biome.json')),
    fileExists(resolvePath(cwd, 'biome.jsonc')),
  ]).then(([hasJson, hasJsonc]) => {
    if (hasJson) return { path: resolvePath(cwd, 'biome.json'), isJsonc: false }
    if (hasJsonc) return { path: resolvePath(cwd, 'biome.jsonc'), isJsonc: true }
    return { path: null, isJsonc: false }
  })
}

export const ultraciteTask: Task = {
  id: 'lint/ultracite',
  label: 'Ultracite preset',
  group: 'Linting & Formatting',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const { path: biomePath } = await findBiomeConfigPath(cwd)
    if (!biomePath) return 'conflict'

    const content = await readFile(biomePath)
    const parsed = parseJsonc(content) as Record<string, unknown>
    const extendsList = parsed.extends as string[] | undefined
    if (extendsList?.includes('ultracite') || extendsList?.some(e => e.startsWith('ultracite/'))) {
      const pkg = await readPackageJson(cwd)
      if (pkg?.devDependencies?.['ultracite']) return 'skip'
    }

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const { path: biomePath, isJsonc } = await findBiomeConfigPath(cwd)
    const before = biomePath ? await readFile(biomePath) : null
    const existing = before ? (parseJsonc(before) as Record<string, unknown>) : {}
    const incoming = { extends: ['ultracite'] }
    const merged = mergeJson(existing, incoming)
    const after = JSON.stringify(merged, null, 2)

    const filepath = isJsonc ? 'biome.jsonc' : 'biome.json'
    return [{ filepath, before, after }]
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
