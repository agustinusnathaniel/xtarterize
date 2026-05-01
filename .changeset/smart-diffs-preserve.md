---
"@xtarterize/patchers": minor
"@xtarterize/tasks": minor
"xtarterize": minor
---

feat: surgical JSON patching, smart equivalence detection, and merged diffs

**Surgical JSON Patching**
- Added `patchJson` to `@xtarterize/patchers` using `jsonc-parser` for byte-level text edits
- Preserves comments, key ordering, whitespace, and indentation in JSON/JSONC files
- All JSON config tasks (`createJsonMergeTask`, `createMultiFileJsonMergeTask`, `createPackageJsonTask`) now produce minimal, formatting-preserving diffs

**Smart Equivalence Detection**
- Package scripts are now deduplicated by **value**, not just key name
  - Skips adding `"typecheck": "tsc --noEmit"` when `"type:check": "tsc --noEmit"` already exists
- Added `normalizeExtends` helper for config files
  - Treats `"extends": "config:base"` and `"extends": ["config:base"]` as equivalent
- Added `normalizeLineEndings` for text file comparison (CRLF vs LF)
- Removed "conflict" status for script mismatches; existing scripts are preserved, only missing ones are added

**Merged CLI Diffs**
- `diff` command and `init --dry-run` now merge multiple task diffs targeting the same JSON file into a single unified diff
- Shows the complete intended state instead of overlapping individual patches

**Bug Fixes**
- Fixed `resolveTaskFile` incorrectly stripping `.config` from filenames (e.g., `commitlint.config.ts`)
- `renovateTask` converted from `createSimpleFileTask` to `createJsonMergeTask` for proper incremental merging
- `biomeTask` and `renovateTask` now handle string-form `extends` values correctly
