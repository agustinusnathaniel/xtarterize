const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	dim: '\x1b[2m',
	cyan: '\x1b[36m',
	bold: '\x1b[1m',
}

export function green(text: string): string {
	return `${colors.green}${text}${colors.reset}`
}

export function yellow(text: string): string {
	return `${colors.yellow}${text}${colors.reset}`
}

export function red(text: string): string {
	return `${colors.red}${text}${colors.reset}`
}

export function dim(text: string): string {
	return `${colors.dim}${text}${colors.reset}`
}

export function cyan(text: string): string {
	return `${colors.cyan}${text}${colors.reset}`
}

export function bold(text: string): string {
	return `${colors.bold}${text}${colors.reset}`
}

export function log(...args: unknown[]): void {
	console.log(...args)
}

export function logSuccess(message: string): void {
	console.log(`${green('✔')} ${message}`)
}

export function logWarn(message: string): void {
	console.log(`${yellow('⚠')} ${message}`)
}

export function logError(message: string): void {
	console.log(`${red('✖')} ${message}`)
}

export function logInfo(message: string): void {
	console.log(`${cyan('ℹ')} ${message}`)
}
