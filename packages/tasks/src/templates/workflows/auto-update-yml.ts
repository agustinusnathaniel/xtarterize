export function renderAutoUpdateWorkflow(): string {
  return `name: Auto Update

on:
  schedule:
    - cron: '0 0 * * 1'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx npm-check-updates -u
      - run: git add .
      - run: git commit -m "chore: update dependencies" || echo "No changes"
      - run: git push
`
}
