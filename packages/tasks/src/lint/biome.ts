import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson, readJsonIfExists } from '@xtarterize/core'
import { mergeJson, parseJsonc } from '@xtarterize/patchers'
import { addDependency } from 'nypm'
import { renderBiomeJson } from '../templates/biome-json.js'

async function findBiomeConfigPath(cwd: string): Promise<string | null> {
  const jsonPath = resolvePath(cwd, 'biome.json')
  if (await fileExists(jsonPath)) return jsonPath
  const jsoncPath = resolvePath(cwd, 'biome.jsonc')
  if (await fileExists(jsoncPath)) return jsoncPath
  return null
}

export const biomeTask: Task = {
  id: 'lint/biome',
  label: 'Biome (lint + format)',
  group: 'Linting & Formatting',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const biomePath = await findBiomeConfigPath(cwd)
    if (!biomePath) return 'new'

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
    const biomePath = await findBiomeConfigPath(cwd)
    const before = biomePath ? await readFile(biomePath) : null

    let after: string
    if (before) {
      const existing = parseJsonc(before) as object
      const incoming = JSON.parse(renderBiomeJson(profile))
      after = JSON.stringify(mergeJson(existing, incoming), null, 2)
    } else {
      after = renderBiomeJson(profile)
    }

    const filepath = biomePath?.endsWith('.jsonc') ? 'biome.jsonc' : 'biome.json'
    return [{ filepath, before, after }]
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
