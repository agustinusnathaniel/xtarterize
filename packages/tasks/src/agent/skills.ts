import type { Task, TaskStatus, FileDiff } from '@xtarterize/core'
import type { ProjectProfile } from '@xtarterize/core'
import { fileExists, writeFile, resolvePath, ensureDir } from '@xtarterize/core'

export const skillsTask: Task = {
  id: 'agent/skills',
  label: 'AI Skills directory',
  group: 'Agent',
  applicable: (profile) => profile.typescript,

  async check(cwd, profile): Promise<TaskStatus> {
    const skillsDir = resolvePath(cwd, '.agents', 'skills')
    const exists = await fileExists(skillsDir)
    if (!exists) return 'new'

    const skillFile = resolvePath(cwd, '.agents', 'skills', 'project-context.md')
    const skillExists = await fileExists(skillFile)
    if (!skillExists) return 'patch'

    return 'skip'
  },

  async dryRun(cwd, profile): Promise<FileDiff[]> {
    const diffs: FileDiff[] = []

    const skillsDir = resolvePath(cwd, '.agents', 'skills')
    const dirExists = await fileExists(skillsDir)
    const before = dirExists ? '(directory exists)' : null

    const skillContent = renderProjectContext(profile)
    diffs.push({ filepath: '.agents/skills/project-context.md', before, after: skillContent })

    return diffs
  },

  async apply(cwd, profile): Promise<void> {
    const skillsDir = resolvePath(cwd, '.agents', 'skills')
    await ensureDir(skillsDir)

    const skillPath = resolvePath(cwd, '.agents', 'skills', 'project-context.md')
    const content = renderProjectContext(profile)
    await writeFile(skillPath, content)
  }
}

function renderProjectContext(profile: ProjectProfile): string {
  const pm = profile.packageManager
  const runCmd = pm === 'npm' ? 'npm run' : pm

  return `# Project Context

## Tech Stack
- **Framework**: ${profile.framework ?? 'none'}
- **Bundler**: ${profile.bundler ?? 'none'}
- **Router**: ${profile.router ?? 'none'}
- **Styling**: ${profile.styling.join(', ')}
- **Runtime**: ${profile.runtime}
- **Package Manager**: ${pm}
- **TypeScript**: ${profile.typescript ? 'Yes' : 'No'}
- **Monorepo**: ${profile.monorepo ? `Yes (${profile.monorepoTool ?? 'unknown'})` : 'No'}

## Commands
- Install: \`${pm} install\`
- Dev: \`${runCmd} dev\`
- Build: \`${runCmd} build\`
- Lint: \`${runCmd} lint\`
- Typecheck: \`${runCmd} typecheck\`
- Test: \`${runCmd} test\`

## Conventions
- Use Biome for linting and formatting
- Conventional Commits for commit messages
- kebab-case for files, PascalCase for components, camelCase for functions
- Never commit generated files
`
}