import fs from 'node:fs/promises'
import path from 'node:path'
import { resolvePath, readFile, writeFile, fileExists, readJsonIfExists, writeJson } from './utils/fs.js'

export interface Backup {
  filepath: string
  backupPath: string
  timestamp: string
}

const BACKUP_DIR = '.xtarterize/backups'

export async function backupFile(cwd: string, filepath: string): Promise<void> {
  const sourcePath = resolvePath(cwd, filepath)
  const exists = await fileExists(sourcePath)
  if (!exists) return
  
  const backupDir = resolvePath(cwd, BACKUP_DIR)
  await fs.mkdir(backupDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupName = filepath.replace(/\//g, '__') + '.' + timestamp
  const backupPath = path.join(backupDir, backupName)
  
  await fs.cp(sourcePath, backupPath)
  
  const indexPath = resolvePath(cwd, BACKUP_DIR, '.index.json')
  const index = await readJsonIfExists<Record<string, Backup[]>>(indexPath) ?? {}
  const backups = index[filepath] ?? []
  backups.push({ filepath, backupPath, timestamp })
  index[filepath] = backups
  await writeJson(indexPath, index)
}

export async function listBackups(cwd: string, filepath: string): Promise<Backup[]> {
  const indexPath = resolvePath(cwd, BACKUP_DIR, '.index.json')
  const index = await readJsonIfExists<Record<string, Backup[]>>(indexPath)
  if (!index || !index[filepath]) return []
  
  return index[filepath].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export async function restoreBackup(cwd: string, backup: Backup): Promise<void> {
  const sourcePath = resolvePath(cwd, backup.filepath)
  await fs.cp(backup.backupPath, sourcePath)
}
