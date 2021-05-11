# Rapidbundle

![Build](https://github.com/umidbekk/rapidbundle/workflows/Main/badge.svg)
[![npm version](https://img.shields.io/npm/v/rapidbundle.svg)](https://www.npmjs.com/package/rapidbundle)
[![npm downloads](https://img.shields.io/npm/dm/rapidbundle.svg)](https://www.npmjs.com/package/rapidbundle)
[![Codecov](https://img.shields.io/codecov/c/gh/umidbekk/rapidbundle.svg)](https://codecov.io/gh/umidbekk/rapidbundle)

### Installation

```bash
npm i -D rapidbundle
# or with yarn
yarn add -D rapidbundle
```

### Usage

```bash
npx rapidbundle
# or with yarn
yarn rapidbundle
```

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
    ".": "./dist/index.esm.js",
    "./feature": "./dist/feature.esm.js",
    "./feature/index.js": "./dist/feature.esm.js"
  },
  "engines": {
    "node": ">=14"
  }
}
```

#### Browser [Not Implemented]

> `browserlist` will be converted to [esbuild target](https://esbuild.github.io/api/#target)

```json
{
  "browser": "./dist/index.browser.js",
  "browserslist": ["defaults", "not IE 11", "maintained node versions"]
}
```

#### Browser (ESM) [Not Implemented]

1. Set `module` field.

```json
{
  "module": "./dist/index.esm.js"
}
```

#### TypeScript definitions [Not Implemented]

```json
{
  "types": "./dist/index.d.ts"
}
```

#### GitHub Action

```yaml
runs:
  using: "node12"
  main: "dist/index.js"
```
