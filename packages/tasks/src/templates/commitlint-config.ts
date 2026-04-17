export function renderCommitlintConfig(): string {
  return `/** @type {import('@commitlint/types').UserConfig} */
const CommitLintConfiguration = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    'scope-enum': [
      2,
      'always',
      ['components', 'deps', 'utils', 'config', 'docs'],
    ],
  },
};

export default CommitLintConfiguration;
`
}
