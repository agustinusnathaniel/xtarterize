import type { Task, TaskStatus } from '@xtarterize/core'
import * as logger from '@xtarterize/core'

export function displayPlan(
  tasks: Task[],
  statuses: Map<string, TaskStatus>,
  title = 'Conformance plan'
): void {
  logger.log('')
  logger.log(logger.bold(title))
  logger.log('')
  
  for (const task of tasks) {
    const status = statuses.get(task.id) ?? 'new'
    const statusLabel = getStatusLabel(status, task)
    const colorFn = getStatusColor(status)
    
    const idCol = task.id.padEnd(25)
    const labelCol = task.label.padEnd(40)
    
    logger.log(`  ${colorFn(statusLabel)} ${labelCol} ${logger.dim(idCol)}`)
  }
  
  logger.log('')
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
      return logger.green
    case 'patch':
      return logger.yellow
    case 'skip':
      return logger.dim
    case 'conflict':
      return logger.red
    default:
      return (t: string) => t
  }
}
