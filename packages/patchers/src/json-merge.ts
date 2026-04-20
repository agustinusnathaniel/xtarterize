import { defu } from 'defu'
import JSON5 from 'json5'

export function parseJsonc(text: string): unknown {
	return JSON5.parse(text)
}

export function mergeJson(existing: object, incoming: object): object {
	return defu(existing, incoming)
}
