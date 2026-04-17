import { describe, it, expect } from 'vitest'
import { detectProject } from '@xtarterize/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('detectProject', () => {
  it('detects react-vite-tailwind correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'react-vite-tailwind'))
    expect(profile.framework).toBe('react')
    expect(profile.bundler).toBe('vite')
    expect(profile.styling).toContain('tailwind')
    expect(profile.packageManager).toBe('pnpm')
    expect(profile.typescript).toBe(true)
  })

  it('detects react-vite-no-styling correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'react-vite-no-styling'))
    expect(profile.framework).toBe('react')
    expect(profile.bundler).toBe('vite')
    expect(profile.styling).toContain('vanilla')
    expect(profile.packageManager).toBe('npm')
  })

  it('detects vue-vite correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'vue-vite'))
    expect(profile.framework).toBe('vue')
    expect(profile.bundler).toBe('vite')
    expect(profile.packageManager).toBe('pnpm')
  })

  it('detects nextjs correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'nextjs'))
    expect(profile.framework).toBe('react')
    expect(profile.bundler).toBe('nextjs')
    expect(profile.packageManager).toBe('pnpm')
  })

  it('detects react-native-expo correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'react-native-expo'))
    expect(profile.framework).toBe('react-native')
    expect(profile.bundler).toBe('expo')
    expect(profile.packageManager).toBe('yarn')
  })

  it('detects node-only correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'node-only'))
    expect(profile.framework).toBe('node')
    expect(profile.bundler).toBe('none')
    expect(profile.packageManager).toBe('pnpm')
  })

  it('detects monorepo-turbo correctly', async () => {
    const profile = await detectProject(path.join(fixtures, 'monorepo-turbo'))
    expect(profile.monorepo).toBe(true)
    expect(profile.monorepoTool).toBe('turbo')
    expect(profile.workspaceRoot).toBe(true)
  })
})
