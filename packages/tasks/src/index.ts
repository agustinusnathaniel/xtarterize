import type { Task } from '@xtarterize/core'
import { biomeTask } from './lint/biome.js'
import { ultraciteTask } from './lint/ultracite.js'
import { agentsMdTask } from './agent/agents-md.js'
import { skillsTask } from './agent/skills.js'
import { vscodeTask } from './editor/vscode.js'
import { vscodeExtensionsTask } from './editor/vscode-extensions.js'
import { turboTask } from './monorepo/turbo.js'
import { plopTask } from './codegen/plop.js'
import { knipTask } from './quality/knip.js'
import { commitlintTask } from './release/commitlint.js'
import { czgTask } from './release/czg.js'
import { catVersionTask } from './release/cat-version.js'
import { renovateTask } from './deps/renovate.js'
import { ciWorkflowTask } from './ci/ci.js'
import { autoUpdateWorkflowTask } from './ci/auto-update.js'
import { releaseWorkflowTask } from './ci/release.js'
import { viteVisualizerTask } from './vite/visualizer.js'
import { viteCheckerTask } from './vite/checker.js'
import { incrementalTask } from './ts/incremental.js'
import { packageScriptsTask } from './scripts/package-scripts.js'

export {
  biomeTask,
  ultraciteTask,
  agentsMdTask,
  skillsTask,
  vscodeTask,
  vscodeExtensionsTask,
  turboTask,
  plopTask,
  knipTask,
  commitlintTask,
  czgTask,
  catVersionTask,
  renovateTask,
  ciWorkflowTask,
  autoUpdateWorkflowTask,
  releaseWorkflowTask,
  viteVisualizerTask,
  viteCheckerTask,
  incrementalTask,
  packageScriptsTask,
}

export function getAllTasks(): Task[] {
  return [
    biomeTask,
    ultraciteTask,
    incrementalTask,
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
    vscodeExtensionsTask,
    agentsMdTask,
    skillsTask,
    packageScriptsTask,
  ]
}
