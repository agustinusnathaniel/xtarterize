# @xtarterize/patchers

## 1.2.1

## 1.2.0

### Minor Changes

- [`ccd9287`](https://github.com/agustinusnathaniel/xtarterize/commit/ccd9287afd967ed1ea0ef0c64b4a4a468e95b550) Thanks [@agustinusnathaniel](https://github.com/agustinusnathaniel)! - feat: add `patchJson` for surgical JSON text edits using `jsonc-parser`

  Replaced `JSON.stringify(mergeJson(...), null, 2)` with `patchJson`, which performs byte-level text edits via Microsoft's [`jsonc-parser`](https://github.com/microsoft/node-jsonc-parser). This preserves:

  - Comments (`// inline` and `/* block */`)
  - Key ordering
  - Whitespace and indentation style
  - Trailing commas (in JSONC)

  Applies to all JSON config tasks: `createJsonMergeTask`, `createMultiFileJsonMergeTask`, and `createPackageJsonTask`.

  **BREAKING CHANGE for consumers:** `@xtarterize/patchers` now requires `jsonc-parser` as a runtime dependency. The CLI bundler marks it as `neverBundle` to avoid inline bundling issues.

### Patch Changes

- [`5b93cc4`](https://github.com/agustinusnathaniel/xtarterize/commit/5b93cc443fbe95d6ec777daa1f47e4520e25f3e1) Thanks [@agustinusnathaniel](https://github.com/agustinusnathaniel)! - chore: update dependencies to latest safe versions

  - `@clack/prompts` ^1.2.0 → ^1.3.0
  - `astro` ^6.1.10 → ^6.2.1
  - `sharp` ^0.34.3 → ^0.34.5
  - `pnpm` ^10.24.0 → ^10.33.2 (packageManager)
  - `turbo` ^2.9.6 → ^2.9.7
  - `defu` ^6.1.4 → ^6.1.7
  - `js-yaml` ^4.1.0 → ^4.1.1
  - Removed deprecated `@types/diff` (diff@9 ships built-in types)
  - `@tailwindcss/vite` kept at 4.2.2 (4.2.4 incompatible with current Vite)

## 1.1.1

## 1.1.0

## 1.0.1

## 1.0.0
