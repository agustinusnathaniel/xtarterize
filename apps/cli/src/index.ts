#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import { initCommand } from './commands/init.js'
import { syncCommand } from './commands/sync.js'
import { diffCommand } from './commands/diff.js'
import { checkCommand } from './commands/check.js'
import { addCommand } from './commands/add.js'
import { restoreCommand } from './commands/restore.js'
import { listCommand } from './commands/list.js'

const main = defineCommand({
  meta: {
    name: 'xtarterize',
    version: '0.1.0',
    description: 'Apply conformance configuration to JS/TS projects',
  },
  args: {
    cwd: {
      type: 'string',
      description: 'Target directory (default: current working directory)',
    },
    json: {
      type: 'boolean',
      description: 'Output machine-readable JSON',
    },
  },
  subCommands: {
    init: initCommand,
    sync: syncCommand,
    diff: diffCommand,
    check: checkCommand,
    add: addCommand,
    restore: restoreCommand,
    list: listCommand,
  },
})

runMain(main)
