import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson } from '@xtarterize/core'
import { renderKnipConfig } from '../templates/knip-config.js'
import { addDependency } from 'nypm'

export const knipTask: Task = {
  id: 'quality/knip',
  label: 'Knip (unused code detection)',
  group: 'Quality',
  applicable: (profile) => profile.typescript,

  async check(cwd, profile): Promise<TaskStatus> {
    const configPath = resolvePath(cwd, 'knip.json')
    const exists = await fileExists(configPath)

    const pkg = await readPackageJson(cwd)
    const hasKnip = pkg?.devDependencies?.['knip']

    if (exists && hasKnip) return 'skip'
    if (!exists && !hasKnip) return 'new'
    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const configPath = resolvePath(cwd, 'knip.json')
    const exists = await fileExists(configPath)
    const before = exists ? await readFile(configPath) : null
    const after = renderKnipConfig(profile)

    return [{ filepath: 'knip.json', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['knip']) {
      await addDependency(['knip'], { cwd, dev: true })
    }

    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
