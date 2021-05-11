"use strict";

const injectTestModule = require("./__testutils__/injectTestModule");
const bundleTestFixture = require("./__testutils__/bundleTestFixture");

beforeAll(async () => {
  await injectTestModule("is-function", {
    exports: `
export function isFunction(input) {
  return typeof input == 'function';
}
`,
  });
});

test("basic", async () => {
  const { main } = await bundleTestFixture(
    `
import { isFunction } from 'is-function';
export const CAN_USE_DOM = typeof document == 'object' && isFunction(document?.createElement);
`,
    { main: "dist.js" }
  );

  expect(main).toMatchSnapshot();
});

test("version", async () => {
  const { main } = await bundleTestFixture("export let foo = bar?.baz;", {
    main: "dist.js",
    engines: { node: ">=10" },
  });

  expect(main).toMatchSnapshot();
});

test("dependencies", async () => {
  const { main } = await bundleTestFixture(
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

  expect(main).toMatchSnapshot();
});
