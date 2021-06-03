# RapidBundle

[![Build](https://github.com/umidbekk/rapidbundle/workflows/Main/badge.svg)](https://github.com/umidbekk/rapidbundle/actions/workflows/main.yml)
[![npm version](https://img.shields.io/npm/v/rapidbundle.svg)](https://www.npmjs.com/package/rapidbundle)
[![npm downloads](https://img.shields.io/npm/dm/rapidbundle.svg)](https://www.npmjs.com/package/rapidbundle)
[![Codecov](https://img.shields.io/codecov/c/gh/umidbekk/rapidbundle.svg)](https://codecov.io/gh/umidbekk/rapidbundle)

## Installation

```bash
npm i -D rapidbundle
# or with yarn
yarn add -D rapidbundle
```

## Usage

```bash
npx rapidbundle
# or with yarn
yarn rapidbundle
```

# GitHub Action

- Bundles everything to a single file
- Uses `runs.using` property from the `action.yml` to set [esbuild target](https://esbuild.github.io/api/#target)
- Uses `runs.main` property from the `action.yml` to set [esbuild output file](https://esbuild.github.io/api/#outfile) and infer [esbuild entry points](https://esbuild.github.io/api/#entry-points)

### Constraints:

1. Entry file should be located in the `src` directory.
2. Output files should be located in the `dist` directory.

This allows us to properly infer entry point name from the `action.yml`.

For example, if you have `action.yml` like that:

```yaml
runs:
  using: "node12"
  pre: "./dist/setup.js"
  main: "./dist/index.js"
  post: "./dist/cleanup.js"
```

It will produce 3 output files in `dist` directory and look for the same file
paths in `src` directory

```
├─ src
│  ├─ setup.ts
│  ├─ index.ts
│  └─ cleanup.ts
├─ dist
│  ├─ setup.js
│  ├─ index.js
│  └─ cleanup.js
└─ action.yml
```

<details>
   <summary>Produced esbuild options (https://esbuild.github.io/api/#simple-options)</summary>

```json
[
  {
    "outdir": "./dist",
    "entryPoints": ["./src/setup", "./src/index", "./src/cleanup"],
    "format": "cjs",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"]
  }
]
```

 </details>

# Node Package

### Examples

> Not all features are implemented yet.

#### Node (CJS)

> `engines.node` will be converted to [esbuild target](https://esbuild.github.io/api/#target)

```json
{
  "main": "./dist/index.cjs.js",
  "engines": {
    "node": ">=12"
  }
}
```

#### Node (ESM) [Not Implemented]

> `engines.node` will be converted to [esbuild target](https://esbuild.github.io/api/#target)

```json
{
  "exports": {
    ".": "./dist/index.esm",
    "./feature": "./dist/feature.esm",
    "./feature/index.js": "./dist/feature.esm"
  },
  "engines": {
    "node": ">=14"
  }
}
```

#### Browser

> Browserlist: `> 0.5%, last 2 versions, Firefox ESR, not dead, not IE 11`

```json
{
  "module": "./dist/index.esm.js"
}
```

#### TypeScript definitions

```json
{
  "types": "./dist/index.d.ts"
}
```
