"use strict";

const StandardError = require("./utils/StandardError");
const BuildNodeTask = require("./tasks/BuildNodeTask");
const NodePackageManifest = require("./manifests/NodePackageManifest");

/**
 * @param {string} cwd
 * @returns {Promise<void>}
 */
async function main(cwd) {
  const manifest = await NodePackageManifest.findPkg(cwd);
  const tasks = [new BuildNodeTask(manifest, { cwd })];

  for (const task of tasks) {
    await task.run();
  }
}

/**
 * @param {string} cwd
 * @returns {Promise<void>}
 */
module.exports = async function bundle(cwd) {
  try {
    await main(cwd);
  } catch (error) {
    if (error instanceof StandardError) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
};
