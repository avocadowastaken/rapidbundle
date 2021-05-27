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

- Bundles everything to single file
- Uses `runs.using` property from the `action.yml` to set [esbuild target](https://esbuild.github.io/api/#target)
- Uses `runs.main` property from the `action.yml` to set [esbuild output file](https://esbuild.github.io/api/#outfile) and infer [esbuild entry points](https://esbuild.github.io/api/#entry-points)

There some not configurable rules you should follow:

1. Entry file should be located in the `src` directory.
2. Output files should be located in the `dist` directory.

This allows us to properly infer entry point name from the `action.yml`.

For example, if you have `action.yml` like that:

```yaml
runs:
  using: "node12"
  main: "dist/action.js"
```

We will look for the `src/action` file with the `.tsx`, `.ts` or `.js` extension.

# Node Package

- Uses `engines.node` property from the `package.json` to set [esbuild target](https://esbuild.github.io/api/#target)
- Uses `exports` property from the `package.json` to set [esbuild platform](https://esbuild.github.io/api/#platform), [esbuild output file](https://esbuild.github.io/api/#outfile) and infer [esbuild entry points](https://esbuild.github.io/api/#entry-points)
- Targets last 2 stable versions of modern browsers (`npx browserslist "> 0.5%, last 2 versions, Firefox ESR"`)
- Targets maintenance LTS version for Node JS by default
- Replaces `process.env.NODE_ENV`, `import.meta.env.MODE` and `import.meta.env.NODE_ENV` with `"production"` by default (used by [Vite](https://vitejs.dev/guide/env-and-mode.html#env-variables) and [Snowpack](https://www.snowpack.dev/reference/environment-variables#reading-environment-variables))
- Replaces `process.env.DEV` with `false` and `process.env.PROD` with `true` by default (used by [Vite](https://vitejs.dev/guide/env-and-mode.html#env-variables))

There some not configurable rules you should follow:

1. All the entry files should be located in the `src` directory.
2. All the output files should be located in the `dist` directory.

## Examples

> Please check [NodeJS Package](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_modules_packages) docs and [Webpack Package Exports](https://webpack.js.org/guides/package-exports/) guide

### [Main entry point export](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_main_entry_point_export)

Input `package.json`:

```json
{
  "exports": "./dist/main.js"
}
```

<details>
  <summary>Produced esbuild options(https://esbuild.github.io/api/#simple-options)</summary>

```json
[
  {
    "outfile": "./dist/main.js",
    "entryPoints": ["./src/main"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  }
]
```

</details>

### [Subpath exports](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_subpath_exports)

Input `package.json`:

```json
{
  "exports": {
    ".": "./dist/main.js",
    "./submodule": "./dist/submodule.js"
  }
}
```

<details>
  <summary>Produced esbuild options(https://esbuild.github.io/api/#simple-options)</summary>

```json
[
  {
    "outfile": "./dist/main.js",
    "entryPoints": ["./src/main"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  },
  {
    "outfile": "./dist/submodule.js",
    "entryPoints": ["./src/submodule"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  }
]
```

</details>

### [Conditional exports](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_conditional_exports)

> Keep in mind that using multiple entries for Node can lead to [dual package hazard](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_dual_package_hazard)

Input `package.json`:

```json
{
  "exports": {
    "import": "./dist/main.js",
    "require": "./dist/main.cjs"
  }
}
```

<details>
  <summary>Produced esbuild options(https://esbuild.github.io/api/#simple-options)</summary>

```json
[
  {
    "outfile": "./dist/main.js",
    "entryPoints": ["./src/main"],
    "conditions": ["import"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  },
  {
    "outfile": "./dist/main.cjs",
    "entryPoints": ["./src/main"],
    "conditions": ["require"],
    "format": "cjs",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  }
]
```

</details>

### [Nested conditions](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_nested_conditions)

> Keep in mind that using multiple entries for Node can lead to [dual package hazard](https://nodejs.org/docs/latest-v12.x/api/packages.html#packages_dual_package_hazard)

Input `package.json`:

```json
{
  "exports": {
    "node": {
      "import": "./main.mjs",
      "require": "./main.cjs"
    },
    "default": "./main.js"
  }
}
```

<details>
  <summary>Produced esbuild options(https://esbuild.github.io/api/#simple-options)</summary>

```json
[
  {
    "outfile": "./dist/main.mjs",
    "entryPoints": ["./src/main"],
    "conditions": ["node", "import"],
    "format": "esm",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  },
  {
    "outfile": "./dist/main.cjs",
    "entryPoints": ["./src/main"],
    "conditions": ["node", "require"],
    "format": "cjs",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  },
  {
    "outfile": "./dist/main.js",
    "entryPoints": ["./src/main"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  }
]
```

</details>

### [Providing devtools or production optimizations](https://webpack.js.org/guides/package-exports/#providing-devtools-or-production-optimizations)

Input `package.json`:

```json
{
  "exports": {
    "development": {
      "node": {
        "import": "./main.dev.mjs",
        "require": "./main.dev.cjs"
      },
      "default": "./main.dev.js"
    },
    "node": {
      "import": "./main.mjs",
      "require": "./main.cjs"
    },
    "default": "./main.js"
  }
}
```

<details>
  <summary>Produced esbuild options(https://esbuild.github.io/api/#simple-options)</summary>

```json
[
  {
    "outfile": "./dist/main.dev.mjs",
    "entryPoints": ["./src/main.dev"],
    "conditions": ["development", "node", "import"],
    "format": "esm",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"],
    "define": {
      "process.env.NODE_ENV": "\"development\"",
      "import.meta.env.DEV": "true",
      "import.meta.env.PROD": "false",
      "import.meta.env.MODE": "\"development\"",
      "import.meta.env.NODE_ENV": "\"development\""
    }
  },

  {
    "outfile": "./dist/main.dev.cjs",
    "entryPoints": ["./src/main.dev"],
    "conditions": ["development", "node", "require"],
    "format": "cjs",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"],
    "define": {
      "process.env.NODE_ENV": "\"development\"",
      "import.meta.env.DEV": "true",
      "import.meta.env.PROD": "false",
      "import.meta.env.MODE": "\"development\"",
      "import.meta.env.NODE_ENV": "\"development\""
    }
  },

  {
    "outfile": "./dist/main.dev.js",
    "entryPoints": ["./src/main.dev"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["development", "module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"development\"",
      "import.meta.env.DEV": "true",
      "import.meta.env.PROD": "false",
      "import.meta.env.MODE": "\"development\"",
      "import.meta.env.NODE_ENV": "\"development\""
    }
  },

  {
    "outfile": "./dist/main.mjs",
    "entryPoints": ["./src/main"],
    "conditions": ["node", "import"],
    "format": "esm",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  },
  {
    "outfile": "./dist/main.cjs",
    "entryPoints": ["./src/main"],
    "conditions": ["node", "require"],
    "format": "cjs",
    "platform": "node",
    "mainFields": ["main", "module"],
    "target": ["node12"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  },
  {
    "outfile": "./dist/main.js",
    "entryPoints": ["./src/main"],
    "format": "esm",
    "platform": "neutral",
    "mainFields": ["module", "main"],
    "target": ["node12", "chrome 88", "edge 89", "firefox 78", "safari 14"],
    "define": {
      "process.env.NODE_ENV": "\"production\"",
      "import.meta.env.DEV": "false",
      "import.meta.env.PROD": "true",
      "import.meta.env.MODE": "\"production\"",
      "import.meta.env.NODE_ENV": "\"production\""
    }
  }
]
```

</details>
