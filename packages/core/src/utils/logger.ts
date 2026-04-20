import pc from 'picocolors'

export { pc }

export function log(...args: unknown[]): void {
	console.log(...args)
}

export function logSuccess(message: string): void {
	console.log(`${pc.green('✔')} ${message}`)
}

export function logWarn(message: string): void {
	console.log(`${pc.yellow('⚠')} ${message}`)
}

export function logError(message: string): void {
	console.log(`${pc.red('✖')} ${message}`)
}

export function logInfo(message: string): void {
	console.log(`${pc.cyan('ℹ')} ${message}`)
}
