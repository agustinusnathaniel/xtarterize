---
"@xtarterize/tasks": patch
---

fix: `renovateTask` and `biomeTask` extends handling

- Converted `renovateTask` from `createSimpleFileTask` to `createJsonMergeTask` so it properly deep-merges with existing `renovate.json` / `renovate.json5` configs instead of conflicting when the file already exists
- Fixed `biomeTask` to handle string-form `extends` values (e.g., `"extends": "ultracite"`) in addition to arrays
- Added `checkFn` to `renovateTask` for proper `skip` detection when the config already matches
