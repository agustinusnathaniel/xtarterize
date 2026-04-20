import type { ProjectProfile } from '@xtarterize/core'
import { runScriptCommand } from 'nypm'

export function renderAgentsMd(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const runCmd = (script: string) => runScriptCommand(pm, script)

	return `# AGENTS.md

## Project Overview

${profile.framework ? `${profile.framework.charAt(0).toUpperCase() + profile.framework.slice(1)}` : 'Node.js'} project${profile.bundler ? ` with ${profile.bundler}` : ''}.

## Setup Commands

- **Install dependencies**: ${pm} install
- **Start development**: ${runCmd('dev')}
- **Build**: ${runCmd('build')}
- **Lint**: ${runCmd('lint')}
- **Type check**: ${runCmd('typecheck')}
- **Test**: ${runCmd('test')}

## Tech Stack

- **Framework**: ${profile.framework ?? 'none'}
- **Bundler**: ${profile.bundler ?? 'none'}
- **Package Manager**: ${pm}
- **TypeScript**: ${profile.typescript ? 'Yes' : 'No'}

## Code Style

- **Linting**: Biome is enforced
- **Commits**: Conventional Commits required
- **Naming**: kebab-case for files, PascalCase for components, camelCase for functions

## Tips for Agents

- Run quality checks before committing
- Follow existing patterns
- Never edit generated files
`
}
