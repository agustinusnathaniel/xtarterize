---
"@xtarterize/tasks": minor
"xtarterize": minor
---

feat: smart equivalence detection across all task types

Tasks now detect equivalence at the **value/content level**, not just by key name. This prevents redundant or conflicting diffs when the same configuration already exists in a different form.

**Package scripts** — `createPackageJsonTask` skips adding a script if the **exact same command string** already exists under any script name. For example, `"type:check": "tsc --noEmit"` prevents adding `"typecheck": "tsc --noEmit"`.

**JSON config `extends`** — Added `normalizeExtends` helper. `"extends": "config:base"` is now treated as equivalent to `"extends": ["config:base"]"` during comparison. Used by `biomeTask` and `renovateTask`.

**Text files** — `createSimpleFileTask` now normalizes line endings (`\r\n` → `\n`) before comparing content, preventing false mismatches on CRLF files.

**Behavior change:** Tasks that previously returned `conflict` for script mismatches now return `patch` and only add the *missing* scripts. Existing scripts are never overwritten.
