import { readPackageJSON, writePackageJSON } from 'pkg-types'
import { fileExists, resolvePath } from '@/utils/fs.js'

export async function readPackageJson(cwd: string) {
	const pkgPath = resolvePath(cwd, 'package.json')
	const exists = await fileExists(pkgPath)
	if (!exists) return null
	return readPackageJSON(pkgPath)
}

export async function writePackageJson(cwd: string, pkg: unknown): Promise<void> {
	await writePackageJSON(resolvePath(cwd, 'package.json'), pkg as any)
}

export function hasDependency(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }, name: string): boolean {
	return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])
}

export function getDependencyVersion(pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }, name: string): string | undefined {
	return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
}

export function getNodeVersion(pkg: { engines?: Record<string, string> }): string {
	if (pkg.engines?.node) return pkg.engines.node
	return '20'
}
