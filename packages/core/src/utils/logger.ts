import { createConsola } from 'consola'
import pc from 'picocolors'

export { pc }

export const consola = createConsola({
	level: process.env.NODE_ENV === 'test' ? -1 : 3,
	formatOptions: {
		colors: true,
	},
})

export function log(...args: unknown[]): void {
	consola.log(...(args as [unknown]))
}

export function logSuccess(message: string): void {
	consola.success(message)
}

export function logWarn(message: string): void {
	consola.warn(message)
}

export function logError(message: string): void {
	consola.error(message)
}

export function logInfo(message: string): void {
	consola.info(message)
}
