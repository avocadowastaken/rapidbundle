import { parsePackageExports } from "./bundleNodePackage.js";

describe("parsePackageExports", () => {
  test.each([
    [{}, []],
    [null, []],
    ["./dist/main.js", [[".", "./dist/main.js", []]]],
    [{ ".": "./dist/main.js" }, [[".", "./dist/main.js", []]]],

    [
      {
        production: {
          ".": "./cjs/react-dom.production.min.js",
          "./profiling": "./cjs/react-dom.profiling.min.js",

          "./server": {
            node: "./cjs/react-dom-server.node.production.min.js",
            default: "./cjs/react-dom-server.browser.development.js",
          },
        },

        default: {
          ".": "./cjs/react-dom.development.js",
          "./profiling": "./cjs/react-dom.development.js",
          "./server": {
            node: "./cjs/react-dom-server.node.development.js",
            default: "./cjs/react-dom-server.browser.development.js",
          },
        },
      },

      [
        [".", "./cjs/react-dom.production.min.js", ["production"]],
        ["./profiling", "./cjs/react-dom.profiling.min.js", ["production"]],
        [
          "./server",
          "./cjs/react-dom-server.node.production.min.js",
          ["production", "node"],
        ],
        [
          "./server",
          "./cjs/react-dom-server.browser.development.js",
          ["production"],
        ],
        [".", "./cjs/react-dom.development.js", []],
        ["./profiling", "./cjs/react-dom.development.js", []],
        ["./server", "./cjs/react-dom-server.node.development.js", ["node"]],
        ["./server", "./cjs/react-dom-server.browser.development.js", []],
      ],
    ],

    // Node JS examples

    [
      {
        ".": "./main.js",
        "./submodule": "./src/submodule.js",
      },
      [
        [".", "./main.js", []],
        ["./submodule", "./src/submodule.js", []],
      ],
    ],

    [
      { "./features/*": "./src/features/*.js" },
      [["./features/*", "./src/features/*.js", []]],
    ],

    [
      {
        import: "./main-module.js",
        require: "./main-require.cjs",
      },
      [
        [".", "./main-module.js", ["import"]],
        [".", "./main-require.cjs", ["require"]],
      ],
    ],

    [
      {
        ".": "./main.js",
        "./feature": {
          node: "./feature-node.js",
          default: "./feature.js",
        },
      },

      [
        [".", "./main.js", []],
        ["./feature", "./feature-node.js", ["node"]],
        ["./feature", "./feature.js", []],
      ],
    ],

    [
      {
        node: {
          import: "./feature-node.mjs",
          require: "./feature-node.cjs",
        },
        default: "./feature.mjs",
      },
      [
        [".", "./feature-node.mjs", ["node", "import"]],
        [".", "./feature-node.cjs", ["node", "require"]],
        [".", "./feature.mjs", []],
      ],
    ],

    // WebPack example

    [
      {
        exports: {
          ".": "./main.js",
          "./sub/path": "./secondary.js",
          "./prefix/": "./directory/",
          "./prefix/deep/": "./other-directory/",
          "./other-prefix/*": "./yet-another/*/*.js",
        },
      },
      [
        [".", "./main.js", ["exports"]],
        ["./sub/path", "./secondary.js", ["exports"]],
        ["./prefix/", "./directory/", ["exports"]],
        ["./prefix/deep/", "./other-directory/", ["exports"]],
        ["./other-prefix/*", "./yet-another/*/*.js", ["exports"]],
      ],
    ],

    [
      { "./things/": ["./good-things/", "./bad-things/"] },
      [
        ["./things/", "./good-things/", []],
        ["./things/", "./bad-things/", []],
      ],
    ],

    [
      {
        red: "./stop.js",
        green: "./drive.js",
      },
      [
        [".", "./stop.js", ["red"]],
        [".", "./drive.js", ["green"]],
      ],
    ],

    [
      {
        electron: {
          node: {
            development: {
              module: "./index-electron-node-with-devtools.js",
              import: "./wrapper-electron-node-with-devtools.js",
              require: "./index-electron-node-with-devtools.cjs",
            },
            production: {
              module: "./index-electron-node-optimized.js",
              import: "./wrapper-electron-node-optimized.js",
              require: "./index-electron-node-optimized.cjs",
            },
            default: "./wrapper-electron-node-process-env.cjs",
          },
          development: "./index-electron-with-devtools.js",
          production: "./index-electron-optimized.js",
          default: "./index-electron-optimized.js",
        },
        node: {
          development: {
            module: "./index-node-with-devtools.js",
            import: "./wrapper-node-with-devtools.js",
            require: "./index-node-with-devtools.cjs",
          },
          production: {
            module: "./index-node-optimized.js",
            import: "./wrapper-node-optimized.js",
            require: "./index-node-optimized.cjs",
          },
          default: "./wrapper-node-process-env.cjs",
        },
        development: "./index-with-devtools.js",
        production: "./index-optimized.js",
        default: "./index-optimized.js",
      },
      [
        [
          ".",
          "./index-electron-node-with-devtools.js",
          ["electron", "node", "development", "module"],
        ],
        [
          ".",
          "./wrapper-electron-node-with-devtools.js",
          ["electron", "node", "development", "import"],
        ],
        [
          ".",
          "./index-electron-node-with-devtools.cjs",
          ["electron", "node", "development", "require"],
        ],
        [
          ".",
          "./index-electron-node-optimized.js",
          ["electron", "node", "production", "module"],
        ],
        [
          ".",
          "./wrapper-electron-node-optimized.js",
          ["electron", "node", "production", "import"],
        ],
        [
          ".",
          "./index-electron-node-optimized.cjs",
          ["electron", "node", "production", "require"],
        ],
        [".", "./wrapper-electron-node-process-env.cjs", ["electron", "node"]],
        [".", "./index-electron-with-devtools.js", ["electron", "development"]],
        [".", "./index-electron-optimized.js", ["electron", "production"]],
        [".", "./index-electron-optimized.js", ["electron"]],
        [
          ".",
          "./index-node-with-devtools.js",
          ["node", "development", "module"],
        ],
        [
          ".",
          "./wrapper-node-with-devtools.js",
          ["node", "development", "import"],
        ],
        [
          ".",
          "./index-node-with-devtools.cjs",
          ["node", "development", "require"],
        ],
        [".", "./index-node-optimized.js", ["node", "production", "module"]],
        [".", "./wrapper-node-optimized.js", ["node", "production", "import"]],
        [".", "./index-node-optimized.cjs", ["node", "production", "require"]],
        [".", "./wrapper-node-process-env.cjs", ["node"]],
        [".", "./index-with-devtools.js", ["development"]],
        [".", "./index-optimized.js", ["production"]],
        [".", "./index-optimized.js", []],
      ],
    ],
  ])("parsePackageExports(%j) -> %j", (input, expected) => {
    expect(parsePackageExports(input)).toEqual(expected);
  });
});
