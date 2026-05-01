---
"@xtarterize/tasks": patch
---

fix: resolveTaskFile incorrectly stripping `.config` from filenames

`resolveTaskFile` used `filepath.replace(/\.[^.]+$/, '')` which stripped the `.config` suffix from names like `commitlint.config.ts`, causing the file finder to search for `commitlint.ts` instead of `commitlint.config.ts`. The logic now checks whether the existing extension is in the allowed list before stripping, and falls back to searching with the full filename.
