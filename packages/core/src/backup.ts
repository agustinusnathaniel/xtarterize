import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
	fileExists,
	readJsonIfExists,
	resolvePath,
	writeJson,
} from './utils/fs.js'

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
	const backupName = `${filepath.replace(/\//g, '__')}.${timestamp}`
	const backupPath = path.join(backupDir, backupName)

	await fs.cp(sourcePath, backupPath)

	const indexPath = resolvePath(cwd, BACKUP_DIR, '.index.json')
	const index =
		(await readJsonIfExists<Record<string, Backup[]>>(indexPath)) ?? {}
	const backups = index[filepath] ?? []
	backups.push({ filepath, backupPath, timestamp })
	index[filepath] = backups
	await writeJson(indexPath, index)
}

export async function listBackups(
	cwd: string,
	filepath: string,
): Promise<Backup[]> {
	const indexPath = resolvePath(cwd, BACKUP_DIR, '.index.json')
	const index = await readJsonIfExists<Record<string, Backup[]>>(indexPath)
	if (!index?.[filepath]) return []

	return index[filepath].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export async function restoreBackup(
	cwd: string,
	backup: Backup,
): Promise<void> {
	const sourcePath = resolvePath(cwd, backup.filepath)
	await fs.cp(backup.backupPath, sourcePath)
}

const FILE_BACKUP_SUFFIX = '.bak'

export function createFileBackup(filePath: string): string | null {
	if (!fsSync.existsSync(filePath)) {
		return null
	}

	const backupPath = `${filePath}${FILE_BACKUP_SUFFIX}`
	try {
		fsSync.renameSync(filePath, backupPath)
		return backupPath
	} catch {
		return null
	}
}

export function restoreFileBackup(filePath: string): boolean {
	const backupPath = `${filePath}${FILE_BACKUP_SUFFIX}`

	if (!fsSync.existsSync(backupPath)) {
		return false
	}

	try {
		fsSync.renameSync(backupPath, filePath)
		return true
	} catch {
		return false
	}
}

export function deleteFileBackup(filePath: string): boolean {
	const backupPath = `${filePath}${FILE_BACKUP_SUFFIX}`

	if (!fsSync.existsSync(backupPath)) {
		return false
	}

	try {
		fsSync.unlinkSync(backupPath)
		return true
	} catch {
		return false
	}
}

export async function withFileBackup<T>(
	filePath: string,
	task: () => Promise<T>,
): Promise<T> {
	if (!fsSync.existsSync(filePath)) {
		return task()
	}

	const backupPath = createFileBackup(filePath)

	if (!backupPath) {
		throw new Error(`Could not back up ${filePath}.`)
	}

	const restoreBackupOnExit = () => restoreFileBackup(filePath)

	process.on('exit', restoreBackupOnExit)

	try {
		const result = await task()
		process.removeListener('exit', restoreBackupOnExit)
		deleteFileBackup(filePath)
		return result
	} catch (error) {
		process.removeListener('exit', restoreBackupOnExit)
		restoreFileBackup(filePath)
		throw error
	}
}
