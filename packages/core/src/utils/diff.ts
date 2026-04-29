import { diffLines } from 'diff'
import pc from 'picocolors'

export interface FileDiff {
	filepath: string
	before: string | null
	after: string
}

export function generateDiff(before: string | null, after: string): string {
	const changes = diffLines(before ?? '', after)
	const lines: string[] = []

	for (const change of changes) {
		const prefix = change.added ? '+ ' : change.removed ? '- ' : '  '
		const color = change.added ? pc.green : change.removed ? pc.red : String
		const _reset = change.added || change.removed ? pc.reset : String

		for (const line of change.value.split('\n')) {
			if (line === '' && change.value.endsWith('\n')) continue
			lines.push(color(`${prefix}${line}`))
		}
	}

	return lines.join('\n')
}

export function formatDiffHeader(filepath: string, isNew: boolean): string {
	const beforeLabel = isNew ? '/dev/null' : `a/${filepath}`
	const afterLabel = `b/${filepath}`
	const beforePrefix = isNew ? '---' : '---'
	const afterPrefix = '+++'

	return `${beforePrefix} ${beforeLabel}\n${afterPrefix} ${afterLabel}`
}
