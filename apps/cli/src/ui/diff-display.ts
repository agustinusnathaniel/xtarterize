import type { FileDiff } from '@xtarterize/core'
import { generateDiff, formatDiffHeader } from '@xtarterize/core'
import { logger } from '@xtarterize/core'

export function displayDiffs(diffs: FileDiff[]): void {
  for (const diff of diffs) {
    logger.log('')
    logger.log(logger.bold(formatDiffHeader(diff.filepath, diff.before === null)))
    logger.log('')
    logger.log(generateDiff(diff.before, diff.after))
    logger.log('')
  }
}
