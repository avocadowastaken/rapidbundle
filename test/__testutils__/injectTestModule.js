"use strict";

const path = require("path");
const fs = require("fs/promises");
const resolveFixtureDir = require("./resolveFixtureDir");

/**
 * @typedef {object} TestModule
 * @property {string} [main]
 * @property {string} [module]
 * @property {string} [exports]
 */

/**
 * @param {string} name
 * @param {TestModule} module
 * @returns {Promise<() => void>}
 */
module.exports = async function injectTestModule(name, module) {
  const fixtureDir = resolveFixtureDir();
  const moduleDir = path.join(fixtureDir, "node_modules", name);

  await fs.rm(moduleDir, { force: true, recursive: true });
  await fs.mkdir(moduleDir, { recursive: true });

  for (const [entry, code] of Object.entries(module)) {
    await fs.writeFile(
      path.join(moduleDir, `${entry}.js`),
      String(code).trimLeft()
    );
  }

  await fs.writeFile(
    path.join(moduleDir, "package.json"),
    JSON.stringify({
      name,
      main: module.main ? "./main.js" : undefined,
      module: module.module ? "./module.js" : undefined,
      exports: module.exports ? { ".": "./exports.js" } : undefined,
    }),
    "utf8"
  );

  return () => {};
};
