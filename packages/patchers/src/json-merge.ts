import { defu } from 'defu'
import stripJsonComments from 'strip-json-comments'

export function parseJsonc(text: string): unknown {
	const cleaned = stripJsonComments(text)
	return JSON.parse(cleaned)
}

export function mergeJson(existing: object, incoming: object): object {
	return defu(existing, incoming)
}
