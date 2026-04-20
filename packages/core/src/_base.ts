import type { ProjectProfile } from './detect.js'

export type TaskStatus = 'new' | 'patch' | 'skip' | 'conflict'

export interface FileDiff {
	filepath: string
	before: string | null
	after: string
}

export interface Task {
	id: string
	label: string
	group: string
	applicable: (profile: ProjectProfile) => boolean
	check: (cwd: string, profile: ProjectProfile) => Promise<TaskStatus>
	dryRun: (cwd: string, profile: ProjectProfile) => Promise<FileDiff[]>
	apply: (cwd: string, profile: ProjectProfile) => Promise<void>
}
