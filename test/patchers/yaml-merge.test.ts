import { mergeYaml } from '@xtarterize/patchers'
import { describe, expect, it } from 'vitest'

describe('mergeYaml', () => {
	it('fills missing keys from incoming', () => {
		const existing = 'name: test\njobs:\n  build:\n    runs-on: ubuntu-latest'
		const incoming = 'jobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4'
		const result = mergeYaml(existing, incoming)
		expect(result).toContain('runs-on: ubuntu-latest')
		expect(result).toContain('uses: actions/checkout@v4')
	})

	it('incoming keys override existing keys', () => {
		const existing = 'name: existing'
		const incoming = 'name: incoming'
		const result = mergeYaml(existing, incoming)
		expect(result).toContain('name: incoming')
	})

	it('handles nested objects', () => {
		const existing = 'on:\n  push:\n    branches:\n      - main'
		const incoming = 'on:\n  pull_request:\n    branches:\n      - dev'
		const result = mergeYaml(existing, incoming)
		expect(result).toContain('push:')
		expect(result).toContain('pull_request:')
	})
})
