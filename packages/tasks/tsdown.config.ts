import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node18',
  sourcemap: true,
  deps: {
    alwaysBundle: ['@xtarterize/core', '@xtarterize/patchers'],
  },
})
