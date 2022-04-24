# RapidBundle

[![Build](https://github.com/umidbekk/rapidbundle/workflows/Main/badge.svg)](https://github.com/umidbekk/rapidbundle/actions/workflows/main.yml)
[![install size](https://packagephobia.com/badge?p=rapidbundle)](https://packagephobia.com/result?p=rapidbundle)
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

- Creates a single file bundle for each entry
- Scans `action.yml` to obtain build info

  - Infers entries from the `.runs.main`, `.runs.pre` and `.runs.post` fields
  - Infers target Node version from the `.runs.using` field

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

# Node Package

- Creates a single file bundle for each entry
- Scans `package.json` to obtain build info

  - Infers entries from the `.bin`, `.main`, `.module` and `.types` fields
  - Infers target Node version from the `.engines.node` field

### Constraints:

1. Entry file should be located in the `src` directory.
2. Output files should be located in the `dist` directory.

This allows us to properly infer entry point names from the `package.json`.

For example, if you have `package.json` like that:

```json
{
  "bin": "./dist/cli.js",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

It will produce 3 output files in `dist` directory.

```
├─ src
│  ├─ cli.ts
│  └─ index.ts
├─ dist
│  ├─ cli.js
│  ├─ index.js
│  ├─ index.cjs
│  └─ types.d.ts
└─ action.yml
```

### Limitations

File names should not have multiple `.` signs in it:

- `dist/mod.js` will be mapped to `src/mod` and extension will be resolved automatically
- `dist/mod.es.js` will be mapped to `src/mod.es` and will use `.es` extension

### Babel Support

There are limited support for Babel.
We only support:

- `.babel.test` – string value for `RegExp`
- `.babel.plugins` – array of plugin entries (https://babeljs.io/docs/en/options#plugins)
- `.babel.presets` – array of preset entries (https://babeljs.io/docs/en/options#presets)

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "babel": {
    "test": "\\.tsx?",
    "plugins": [["babel-plugin-styled-components", { "namespace": "app" }]]
  }
}
```
