import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson, readJsonIfExists } from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
import { addDependency } from 'nypm'
import { renderBiomeJson } from '../templates/biome-json.js'

export const biomeTask: Task = {
  id: 'lint/biome',
  label: 'Biome (lint + format)',
  group: 'Linting & Formatting',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const biomePath = resolvePath(cwd, 'biome.json')
    const exists = await fileExists(biomePath)
    if (!exists) return 'new'

    const pkg = await readPackageJson(cwd)
    const hasBiome = pkg?.devDependencies?.['@biomejs/biome']
    if (!hasBiome) return 'patch'

    const expected = JSON.parse(renderBiomeJson(profile))
    const actual = await readJsonIfExists(biomePath)
    const merged = mergeJson(actual ?? {}, expected)
    if (JSON.stringify(actual) === JSON.stringify(merged)) return 'skip'

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const biomePath = resolvePath(cwd, 'biome.json')
    const exists = await fileExists(biomePath)
    const before = exists ? await readFile(biomePath) : null

    let after: string
    if (exists && before) {
      const existing = JSON.parse(before)
      const incoming = JSON.parse(renderBiomeJson(profile))
      after = JSON.stringify(mergeJson(existing, incoming), null, 2)
    } else {
      after = renderBiomeJson(profile)
    }

    return [{ filepath: 'biome.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }

    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['@biomejs/biome']) {
      await addDependency(['@biomejs/biome'], { cwd, dev: true })
    }
  }
}
