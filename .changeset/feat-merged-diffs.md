---
"xtarterize": minor
---

feat: merge duplicate JSON file diffs in CLI output

The `diff` command and `init --dry-run` now group multiple task diffs targeting the same JSON file into a single unified diff. Previously, independent tasks like `ts/incremental`, `ts/paths`, and `ts/strict` each produced a separate `FileDiff` for `tsconfig.json`, resulting in overlapping and confusing output.

Now, diffs are grouped by `filepath` and merged using `patchJson` so the user sees the complete intended state of each file in one view.
