import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson, writePackageJson } from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'

export const packageScriptsTask: Task = {
  id: 'scripts/package-scripts',
  label: 'package.json scripts',
  group: 'Scripts',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const pkg = await readPackageJson(cwd)
    if (!pkg) return 'conflict'

    const scripts = pkg.scripts ?? {}
    const requiredScripts = ['lint', 'format', 'typecheck']
    const missing = requiredScripts.filter((s) => !scripts[s])

    if (missing.length === 0) return 'skip'
    if (missing.length < requiredScripts.length) return 'patch'
    return 'new'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const pkg = await readPackageJson(cwd)
    if (!pkg) return []

    const pm = profile.packageManager
    const scriptsToAdd: Record<string, string> = {
      lint: 'biome lint .',
      format: 'biome format --write .',
      check: 'biome check --write .',
      typecheck: 'tsc --noEmit',
      upgrade: `npx npm-check-updates -u && ${pm} install`,
    }

    const existing = pkg.scripts ?? {}
    const merged = { ...existing, ...scriptsToAdd }
    const after = JSON.stringify({ ...pkg, scripts: merged }, null, 2)
    const before = JSON.stringify(pkg, null, 2)

    return [{ filepath: 'package.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const pkg = await readPackageJson(cwd)
    if (!pkg) return

    const pm = profile.packageManager
    const scriptsToAdd: Record<string, string> = {
      lint: 'biome lint .',
      format: 'biome format --write .',
      check: 'biome check --write .',
      typecheck: 'tsc --noEmit',
      upgrade: `npx npm-check-updates -u && ${pm} install`,
    }

    pkg.scripts = { ...pkg.scripts, ...scriptsToAdd }
    await writePackageJson(cwd, pkg)
  }
}
