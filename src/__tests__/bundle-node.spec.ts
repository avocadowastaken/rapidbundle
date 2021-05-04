import { buildFixture, injectModule } from "../__testutils__/CliUtils";

beforeAll(async () => {
  await injectModule(
    "is-function",
    `
export function isFunction(input) {
  return typeof input == 'function';
}
`
  );
});

test("basic", async () => {
  const { main } = await buildFixture(
    `
import { isFunction } from 'is-function';
export const CAN_USE_DOM = typeof document == 'object' && isFunction(document?.createElement);
`,
    { main: "dist.js" }
  );

  expect(main).toMatchInlineSnapshot(`
    var __defProp = Object.defineProperty;
    var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
    var __name = (target, value) => __defProp(target, "name", {value, configurable: true});
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {get: all[name], enumerable: true});
    };

    // node_modules/.fixtures/bundle-node_spec_ts__basic/src/index.ts
    __markAsModule(exports);
    __export(exports, {
      CAN_USE_DOM: () => CAN_USE_DOM
    });

    // node_modules/is-function/index.js
    function isFunction(input) {
      return typeof input == "function";
    }
    __name(isFunction, "isFunction");

    // node_modules/.fixtures/bundle-node_spec_ts__basic/src/index.ts
    var CAN_USE_DOM = typeof document == "object" && isFunction(document == null ? void 0 : document.createElement);
    // Annotate the CommonJS export names for ESM import in node:
    0 && (module.exports = {
      CAN_USE_DOM
    });
  `);
});

test("version", async () => {
  const { main } = await buildFixture("export let foo = bar?.baz;", {
    main: "dist.js",
    engines: { node: ">=10" },
  });

  expect(main).toMatchInlineSnapshot(`
    var __defProp = Object.defineProperty;
    var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {get: all[name], enumerable: true});
    };

    // node_modules/.fixtures/bundle-node_spec_ts__version/src/index.ts
    __markAsModule(exports);
    __export(exports, {
      foo: () => foo
    });
    var foo = bar == null ? void 0 : bar.baz;
    // Annotate the CommonJS export names for ESM import in node:
    0 && (module.exports = {
      foo
    });
  `);
});

test("dependencies", async () => {
  const { main } = await buildFixture(
    `
import { isFunction } from 'is-function';
import debug = require('debug');
import isObject = require('isobject');
export const logger = debug('app');
if (isObject(console) && isFunction(console.log)) logger.log = console.log.bind(console);
`,
    {
      main: "dist.js",
      dependencies: { debug: "*" },
      peerDependencies: { isobject: "*" },
    }
  );

  expect(main).toMatchInlineSnapshot(`
    var __defProp = Object.defineProperty;
    var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
    var __name = (target, value) => __defProp(target, "name", {value, configurable: true});
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {get: all[name], enumerable: true});
    };

    // node_modules/.fixtures/bundle-node_spec_ts__dependencies/src/index.ts
    __markAsModule(exports);
    __export(exports, {
      logger: () => logger
    });

    // node_modules/is-function/index.js
    function isFunction(input) {
      return typeof input == "function";
    }
    __name(isFunction, "isFunction");

    // node_modules/.fixtures/bundle-node_spec_ts__dependencies/src/index.ts
    var debug = require("debug");
    var isObject = require("isobject");
    var logger = debug("app");
    if (isObject(console) && isFunction(console.log))
      logger.log = console.log.bind(console);
    // Annotate the CommonJS export names for ESM import in node:
    0 && (module.exports = {
      logger
    });
  `);
});
