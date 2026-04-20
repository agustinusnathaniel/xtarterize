import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli/index.ts'],
  target: 'node18',
  sourcemap: true,
})
