import type { ProjectProfile } from '@xtarterize/core'
import { runScriptCommand } from 'nypm'

export function renderAgentsMd(profile: ProjectProfile): string {
	const pm = profile.packageManager
	const runCmd = (script: string) => runScriptCommand(pm, script)
	const frameworkGuidance = {
		react:
			'- Keep components small and colocate component-only styles/tests with the component.\n- Prefer framework router conventions over custom navigation glue.',
		'react-native':
			'- Keep native screens under the detected router/screens directory.\n- Test on the target platform when touching layout, gestures, or native modules.',
		vue: '- Prefer single-file components and the Composition API.\n- Keep route-level data loading in router/page modules.',
		svelte:
			'- Use Svelte component conventions and keep stores focused.\n- Avoid moving browser-only code into server-rendered modules.',
		solid:
			'- Use fine-grained signals/memos instead of broad mutable state.\n- Keep route modules thin and component logic explicit.',
		node: '- Keep side effects at application boundaries.\n- Separate transport, domain logic, and persistence modules.',
	} as const
	const selectedGuidance = profile.framework
		? frameworkGuidance[profile.framework]
		: null

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
${profile.typescript ? '- **Types**: prefer explicit public API types and avoid `any` in application code' : '- **JavaScript**: keep module boundaries clear and validate external inputs'}

## Framework Guidance

${selectedGuidance ?? '- Follow the established structure in the repository before introducing new folders.\n- Keep runtime-specific code isolated behind small modules.'}

## Tips for Agents

- Run quality checks before committing
- Follow existing patterns
- Keep package scripts additive; do not replace a script with different behavior without review
- Never edit generated files
`
}
