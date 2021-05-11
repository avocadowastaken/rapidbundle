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

1. Set `main` field.
2. Set `engines.node` field (optional) (used for [esbuild target](https://esbuild.github.io/api/#target) option)

```json
{
  "name": "my-mod",
  "main": "./cjs/index.js",
  "engines": {
    "node": ">=12"
  }
}
```

#### Node (ESM) [Not Implemented]

1. Set `exports` field.
2. Set `engines.node` field (optional) (used for [esbuild target](https://esbuild.github.io/api/#target))

```json
{
  "name": "my-mod",
  "exports": {
    ".": "./esm/index.js",
    "./feature": "./esm/feature/index.js",
    "./feature/index.js": "./esm/feature/index.js"
  },
  "engines": {
    "node": ">=14"
  }
}
```

#### Browser [Not Implemented]

1. Set `browser` field.
2. Set `browserslist` field (optional) (used for [esbuild target](https://esbuild.github.io/api/#target) option)

```json
{
  "name": "my-mod",
  "browser": "./browser/index.js",
  "browserslist": ["defaults", "not IE 11", "maintained node versions"]
}
```

#### Browser (ESM) [Not Implemented]

1. Set `module` field.

```json
{
  "name": "my-mod",
  "module": "./esm/index.js"
}
```

#### TypeScript definitions [Not Implemented]

1. Set `types` field.

```json
{
  "name": "my-mod",
  "types": "./types/index.d.ts"
}
```
