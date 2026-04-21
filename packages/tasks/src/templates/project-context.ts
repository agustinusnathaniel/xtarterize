import type { ProjectProfile } from '@xtarterize/core'
import { runScriptCommand } from 'nypm'

export function renderProjectContext(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const runCmd = (script: string) => runScriptCommand(pm, script)

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
- Dev: \`${runCmd('dev')}\`
- Build: \`${runCmd('build')}\`
- Lint: \`${runCmd('lint')}\`
- Typecheck: \`${runCmd('typecheck')}\`
- Test: \`${runCmd('test')}\`
## Conventions
- Use Biome for linting and formatting
- Conventional Commits for commit messages
- kebab-case for files, PascalCase for components, camelCase for functions
- Never commit generated files
`
}
