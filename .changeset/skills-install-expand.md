---
"@xtarterize/tasks": minor
"@xtarterize/core": minor
"@xtarterize/patchers": minor
"xtarterize": minor
---

Expand skills-install catalog with 20+ new stack-specific skills and refactor to declarative array format

- Refactored `getSkillsToInstall` from imperative `if/push` blocks to a declarative `SKILL_CATALOG` array with per-skill `condition` functions for easier maintenance
- Added new skills across multiple categories:
  - **Frontend/UI**: `baseline-ui`, `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance`
  - **React**: `react-dev`, `react-useeffect`
  - **Vue/Nuxt**: `vue`, `vue-best-practices`, `nuxt`
  - **Expo/RN**: `upgrading-expo`, `vercel-react-native-skills`
  - **Build tools**: `vite`, `vitest`, `tsdown`, `turborepo`
  - **Database/Auth**: `supabase-postgres-best-practices`, `postgres-drizzle`, `redis-best-practices`, `better-auth-best-practices`, `create-auth-skill`
  - **AI/SDKs**: `ai-sdk`
  - **Specialized**: `remotion-best-practices`
- Updated tests and documentation to reflect the expanded catalog
