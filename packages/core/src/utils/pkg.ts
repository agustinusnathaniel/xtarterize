import { resolvePath, readJson, fileExists } from './fs.js'

export interface PackageJson {
  name: string
  version?: string
  private?: boolean
  type?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  engines?: Record<string, string>
  packageManager?: string
}

export async function readPackageJson(cwd: string): Promise<PackageJson | null> {
  const pkgPath = resolvePath(cwd, 'package.json')
  const exists = await fileExists(pkgPath)
  if (!exists) return null
  return readJson<PackageJson>(pkgPath)
}

export async function writePackageJson(cwd: string, pkg: PackageJson): Promise<void> {
  const { writeJson, resolvePath } = await import('./fs.js')
  await writeJson(resolvePath(cwd, 'package.json'), pkg)
}

export function hasDependency(pkg: PackageJson, name: string): boolean {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}

export function getDependencyVersion(pkg: PackageJson, name: string): string | undefined {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
}

export function getNodeVersion(pkg: PackageJson): string {
  if (pkg.engines?.node) return pkg.engines.node
  return '20'
}
