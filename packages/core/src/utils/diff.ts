import { diffLines, type Change } from 'diff'

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
    const color = change.added ? '\x1b[32m' : change.removed ? '\x1b[31m' : ''
    const reset = '\x1b[0m'

    for (const line of change.value.split('\n')) {
      if (line === '' && change.value.endsWith('\n')) continue
      lines.push(`${color}${prefix}${line}${reset}`)
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
