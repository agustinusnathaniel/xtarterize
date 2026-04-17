import type { ProjectProfile } from '@xtarterize/core'

export function renderCommitlintConfig(profile: ProjectProfile): string {
  const scopeEnum = profile.framework === 'react-native'
    ? "['components', 'screens', 'hooks', 'config', 'docs']"
    : profile.framework === 'vue'
      ? "['components', 'composables', 'views', 'config', 'docs']"
      : "['components', 'hooks', 'pages', 'utils', 'config', 'docs']"

  return `/** @type {import('@commitlint/types').UserConfig} */
const CommitLintConfiguration = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    'scope-enum': [
      2,
      'always',
      ${scopeEnum},
    ],
  },
};

export default CommitLintConfiguration;
`
}
