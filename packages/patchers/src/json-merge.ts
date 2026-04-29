import { createDefu } from 'defu'
import JSON5 from 'json5'

const mergeJsonDefu = createDefu((obj, key, value) => {
	if (Array.isArray(obj[key])) {
		obj[key] = value
		return true
	}
})

export function parseJsonc(text: string): unknown {
	return JSON5.parse(text)
}

export function mergeJson(existing: object, incoming: object): object {
	return mergeJsonDefu(existing, incoming)
}
