import fs from 'fs-extra'
import path from 'node:path'

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath)
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath)
}

export async function readJson<T = Record<string, unknown>>(filePath: string): Promise<T> {
  return fs.readJson(filePath, { throws: false }) as Promise<T>
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeJson(filePath, data, { spaces: 2 })
}

export async function readJsonIfExists<T = Record<string, unknown>>(filePath: string): Promise<T | null> {
  const exists = await fileExists(filePath)
  if (!exists) return null
  return readJson<T>(filePath)
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.ensureDir(path.dirname(dest))
  await fs.copy(src, dest)
}

export function resolvePath(cwd: string, ...segments: string[]): string {
  return path.resolve(cwd, ...segments)
}
