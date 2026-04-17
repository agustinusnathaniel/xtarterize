import { defineCommand } from 'citty'
import { spinner, select, isCancel } from '@clack/prompts'
import { listBackups, restoreBackup } from '@xtarterize/core'
import * as logger from '@xtarterize/core'

export const restoreCommand = defineCommand({
  meta: {
    name: 'restore',
    description: 'Restore a file from backup',
  },
  args: {
    filepath: {
      type: 'positional',
      description: 'File to restore (e.g., tsconfig.json)',
    },
  },
  async run({ args }) {
    const cwd = process.cwd()
    const filepath = args.filepath
    if (!filepath) {
      logger.logError('File path required. Usage: xtarterize restore <filepath>')
      return
    }

    const s = spinner()
    s.start('Loading backups...')

    const backups = await listBackups(cwd, filepath)
    s.stop('Backups loaded')

    if (backups.length === 0) {
      logger.logError(`No backups found for ${filepath}`)
      return
    }

    if (backups.length === 1) {
      await restoreBackup(cwd, backups[0])
      logger.logSuccess(`Restored ${filepath} from backup`)
      return
    }

    const selected = await select({
      message: 'Select backup to restore:',
      options: backups.map(b => ({ value: b, label: `${b.timestamp} - ${b.backupPath}` })),
    })

    if (isCancel(selected)) return

    await restoreBackup(cwd, selected)
    logger.logSuccess(`Restored ${filepath} from backup`)
  },
})
