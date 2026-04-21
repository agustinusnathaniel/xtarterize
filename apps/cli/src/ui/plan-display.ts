import type { Task, TaskStatus } from '@xtarterize/core'
import { pc } from '@xtarterize/core'

export function displayPlan(
	tasks: Task[],
	statuses: Map<string, TaskStatus>,
	title = 'Conformance plan',
): void {
	console.log('')
	console.log(pc.bold(title))
	console.log('')

	for (const task of tasks) {
		const status = statuses.get(task.id) ?? 'new'
		const statusLabel = getStatusLabel(status, task)
		const colorFn = getStatusColor(status)

		const idCol = task.id.padEnd(25)
		const labelCol = task.label.padEnd(40)

		console.log(`  ${colorFn(statusLabel)} ${labelCol} ${pc.dim(idCol)}`)
	}

	const hasBiomeNew = tasks.some((t) => t.id === 'lint/biome' && statuses.get(t.id) === 'new')
	if (hasBiomeNew) {
		console.log(`  ${pc.dim('→ For stricter, opinionated linting, consider running')} ${pc.cyan('npx ultracite init')} ${pc.dim('instead.')}`)
		console.log('')
	}

	console.log('')
}

function getStatusLabel(status: string, task: Task): string {
	switch (status) {
		case 'new':
			return '[new]'
		case 'patch':
			return '[patch]'
		case 'skip':
			return `[skip — ${task.id}]`
		case 'conflict':
			return '[conflict]'
		default:
			return `[${status}]`
	}
}

function getStatusColor(status: string): (text: string) => string {
	switch (status) {
		case 'new':
			return pc.green
		case 'patch':
			return pc.yellow
		case 'skip':
			return pc.dim
		case 'conflict':
			return pc.red
		default:
			return (t: string) => t
	}
}
