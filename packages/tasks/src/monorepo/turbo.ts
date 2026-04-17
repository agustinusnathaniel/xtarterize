import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson, readJsonIfExists } from '@xtarterize/core'
import { mergeJson } from '@xtarterize/patchers'
import { addDependency } from 'nypm'

const TURBO_JSON = `{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}`

export const turboTask: Task = {
  id: 'monorepo/turbo',
  label: 'Turbo (monorepo build)',
  group: 'Monorepo',
  applicable: (profile) => profile.monorepo,

  async check(cwd, profile): Promise<TaskStatus> {
    const turboPath = resolvePath(cwd, 'turbo.json')
    const exists = await fileExists(turboPath)
    if (!exists) return 'new'

    const pkg = await readPackageJson(cwd)
    const hasTurbo = pkg?.devDependencies?.['turbo']
    if (!hasTurbo) return 'patch'

    const expected = JSON.parse(TURBO_JSON)
    const actual = await readJsonIfExists(turboPath)
    const merged = mergeJson(actual ?? {}, expected)
    if (JSON.stringify(actual) === JSON.stringify(merged)) return 'skip'

    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const turboPath = resolvePath(cwd, 'turbo.json')
    const exists = await fileExists(turboPath)
    const before = exists ? await readFile(turboPath) : null

    let after: string
    if (exists && before) {
      const existing = JSON.parse(before)
      const incoming = JSON.parse(TURBO_JSON)
      after = JSON.stringify(mergeJson(existing, incoming), null, 2)
    } else {
      after = TURBO_JSON
    }

    return [{ filepath: 'turbo.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }

    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['turbo']) {
      await addDependency(['turbo'], { cwd, dev: true })
    }
  }
}
