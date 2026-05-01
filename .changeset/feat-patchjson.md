---
"@xtarterize/patchers": minor
"@xtarterize/tasks": minor
"xtarterize": minor
---

feat: add `patchJson` for surgical JSON text edits using `jsonc-parser`

Replaced `JSON.stringify(mergeJson(...), null, 2)` with `patchJson`, which performs byte-level text edits via Microsoft's [`jsonc-parser`](https://github.com/microsoft/node-jsonc-parser). This preserves:

- Comments (`// inline` and `/* block */`)
- Key ordering
- Whitespace and indentation style
- Trailing commas (in JSONC)

Applies to all JSON config tasks: `createJsonMergeTask`, `createMultiFileJsonMergeTask`, and `createPackageJsonTask`.

**BREAKING CHANGE for consumers:** `@xtarterize/patchers` now requires `jsonc-parser` as a runtime dependency. The CLI bundler marks it as `neverBundle` to avoid inline bundling issues.
