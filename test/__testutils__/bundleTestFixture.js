"use strict";

const path = require("path");
const fs = require("fs/promises");

const bundle = require("../../lib/index");

const resolveFixtureDir = require("./resolveFixtureDir");

/** @type {Map<string, string>} */
const snapshots = new Map();

expect.addSnapshotSerializer({
  test(value) {
    return snapshots.has(value);
  },
  print(value) {
    return /** @type {string} */ (snapshots.get(/** @type {string} */ (value)));
  },
});

/**
 * @param {string} input
 * @param {string} output
 */
function saveSnapshot(input, output) {
  snapshots.set(
    output,
    [input.trim(), "~".repeat(60), output.trim()].join("\n")
  );
}

/**
 * @typedef {object} TextFixtureBundleResult
 * @property {string} [main]
 */

/**
 * @param {string} code
 * @param {import("../../lib/manifests/NodePackageManifest").PackageJSON} pkg
 * @returns {Promise<TextFixtureBundleResult>}
 */
module.exports = async function bundleTestFixture(code, pkg) {
  const fixtureDir = resolveFixtureDir();

  await fs.rm(fixtureDir, { force: true, recursive: true });

  const srcDir = path.join(fixtureDir, "src");

  await fs.mkdir(srcDir, { recursive: true });

  await fs.writeFile(
    path.join(fixtureDir, "package.json"),
    JSON.stringify({ ...pkg, name: path.basename(fixtureDir) }),
    "utf8"
  );

  await fs.writeFile(path.join(srcDir, "index.ts"), code, "utf8");

  await bundle(fixtureDir);

  /** @type {TextFixtureBundleResult} */
  const outputs = {};

  if (pkg.main) {
    outputs.main = await fs.readFile(path.join(fixtureDir, pkg.main), "utf8");
    saveSnapshot(code, outputs.main);
  }

  return outputs;
};
