import type { FileDiff } from '@xtarterize/core'
import { formatDiffHeader, generateDiff, pc } from '@xtarterize/core'

export function displayDiffs(diffs: FileDiff[]): void {
	for (const diff of diffs) {
		console.log('')
		console.log(pc.bold(formatDiffHeader(diff.filepath, diff.before === null)))
		console.log('')
		console.log(generateDiff(diff.before, diff.after))
		console.log('')
	}
}
