import type { Task } from '@xtarterize/core'
import { agentsMdTask } from './agent/agents-md.js'
import { skillsTask } from './agent/skills.js'
import { autoUpdateWorkflowTask } from './ci/auto-update.js'
import { ciWorkflowTask } from './ci/ci.js'
import { releaseWorkflowTask } from './ci/release.js'
import { plopTask } from './codegen/plop.js'
import { renovateTask } from './deps/renovate.js'
import { vscodeTask } from './editor/vscode.js'
import { biomeTask } from './lint/biome.js'
import { turboTask } from './monorepo/turbo.js'
import { knipTask } from './quality/knip.js'
import { catVersionTask } from './release/cat-version.js'
import { commitlintTask } from './release/commitlint.js'
import { czgTask } from './release/czg.js'
import { packageScriptsTask } from './scripts/package-scripts.js'
import { incrementalTask } from './ts/incremental.js'
import { gitignoreTsbuildinfoTask } from './ts/gitignore-tsbuildinfo.js'
import { viteCheckerTask } from './vite/checker.js'
import { viteVisualizerTask } from './vite/visualizer.js'

export {
	agentsMdTask,
	autoUpdateWorkflowTask,
	biomeTask,
	catVersionTask,
	ciWorkflowTask,
	commitlintTask,
	czgTask,
	gitignoreTsbuildinfoTask,
	incrementalTask,
	knipTask,
	packageScriptsTask,
	plopTask,
	releaseWorkflowTask,
	renovateTask,
	skillsTask,
	turboTask,
	viteCheckerTask,
	viteVisualizerTask,
	vscodeTask,
}

export function getAllTasks(): Task[] {
	return [
		biomeTask,
		incrementalTask,
		gitignoreTsbuildinfoTask,
		viteCheckerTask,
		viteVisualizerTask,
		releaseWorkflowTask,
		autoUpdateWorkflowTask,
		ciWorkflowTask,
		renovateTask,
		commitlintTask,
		czgTask,
		catVersionTask,
		knipTask,
		plopTask,
		turboTask,
		vscodeTask,
		agentsMdTask,
		skillsTask,
		packageScriptsTask,
	]
}
