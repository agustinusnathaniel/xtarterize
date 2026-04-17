import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, readFile, writeFile, resolvePath, readPackageJson } from '@xtarterize/core'
import { renderPlopfile } from '../templates/plopfile.js'
import { addDependency } from 'nypm'

export const plopTask: Task = {
  id: 'codegen/plop',
  label: 'Plop (code generator)',
  group: 'Codegen',
  applicable: () => true,

  async check(cwd, profile): Promise<TaskStatus> {
    const plopfilePath = resolvePath(cwd, 'plopfile.ts')
    const exists = await fileExists(plopfilePath)

    const pkg = await readPackageJson(cwd)
    const hasPlop = pkg?.devDependencies?.['plop']

    if (exists && hasPlop) return 'skip'
    if (!exists && !hasPlop) return 'new'
    return 'patch'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const plopfilePath = resolvePath(cwd, 'plopfile.ts')
    const exists = await fileExists(plopfilePath)
    const before = exists ? await readFile(plopfilePath) : null
    const after = renderPlopfile(profile)

    return [{ filepath: 'plopfile.ts', before, after }]
  },

  async apply(cwd, profile): Promise<void> {
    const pkg = await readPackageJson(cwd)
    if (!pkg?.devDependencies?.['plop']) {
      await addDependency(['plop'], { cwd, dev: true })
    }

    const diffs = await this.dryRun(cwd, profile)
    for (const diff of diffs) {
      const fullPath = resolvePath(cwd, diff.filepath)
      await writeFile(fullPath, diff.after)
    }
  }
}
