export function renderVscodeSettings(): string {
  return JSON.stringify({
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true,
    "editor.formatOnPaste": true,
    "editor.rulers": [100],
    "typescript.tsdk": "node_modules/typescript/lib",
    "editor.codeActionsOnSave": {
      "source.fixAll.biome": "explicit",
      "source.organizeImports.biome": "explicit"
    },
    "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
    "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
    "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
    "[json]": { "editor.defaultFormatter": "biomejs.biome" },
    "[jsonc]": { "editor.defaultFormatter": "biomejs.biome" }
  }, null, 2)
}
