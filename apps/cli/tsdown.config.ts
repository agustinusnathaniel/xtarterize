import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node18',
  sourcemap: true,
  banner: '#!/usr/bin/env node',
  minify: true,
  treeshake: true,
  deps: {
    alwaysBundle: ['@xtarterize/core', '@xtarterize/tasks', 'nypm'],
  },
})
