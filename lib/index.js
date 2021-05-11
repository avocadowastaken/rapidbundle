"use strict";

const Listr = require("listr");

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
 * @typedef {object} CliContext
 * @property {string} cwd
 * @property {NodePackageManifest} [nodePackageManifest]
 */

/** @type {Listr<CliContext>} */
const tasks = new Listr([
  {
    title: "Getting Node Package manifest",
    async task(ctx) {
      ctx.nodePackageManifest = await NodePackageManifest.findPkg(ctx.cwd);
    },
  },

  {
    title: "Bundling Node Package",
    enabled({ nodePackageManifest }) {
      return !!nodePackageManifest;
    },
    task({ cwd, nodePackageManifest }) {
      const manifest = /** @type {NodePackageManifest} */ (nodePackageManifest);

      return new Listr(
        [
          {
            title: "Bundling for Node target",
            task() {
              const task = new BuildNodeTask(manifest, { cwd });
              return task.run();
            },
          },
        ],
        { concurrent: true }
      );
    },
  },
]);

/**
 * @param {string} cwd
 * @returns {Promise<void>}
 */
module.exports = async function bundle(cwd) {
  try {
    await tasks.run({ cwd });
  } catch (error) {
    if (error instanceof StandardError) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
};
