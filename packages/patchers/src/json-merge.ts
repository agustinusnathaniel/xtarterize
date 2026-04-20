import { defu } from 'defu'
import { type ParseError, parse, printParseErrorCode } from 'jsonc-parser'

export function parseJsonc(text: string): unknown {
	const errors: ParseError[] = []
	const result = parse(text, errors, { allowTrailingComma: true })
	if (errors.length > 0) {
		const messages = errors.map(
			(e) => `${printParseErrorCode(e.error)} at offset ${e.offset}`,
		)
		throw new Error(`Failed to parse JSONC: ${messages.join(', ')}`)
	}
	return result
}

export function mergeJson(existing: object, incoming: object): object {
	return defu(existing, incoming)
}
