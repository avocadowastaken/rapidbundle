"use strict";

const Listr = require("listr");

const StandardError = require("./utils/StandardError");

const NodePackageManifest = require("./manifests/NodePackageManifest");
const GitHubActionManifest = require("./manifests/GitHubActionManifest");

const bundleNodeCJS = require("./tasks/bundleNodeCJS");
const bundleGitHubAction = require("./tasks/bundleGitHubAction");

/**
 * @typedef {object} CliContext
 * @property {string} cwd
 * @property {NodePackageManifest} [nodePackageManifest]
 * @property {GitHubActionManifest} [gitHubActionManifest]
 */

/** @type {Listr<CliContext>} */
const tasks = new Listr([
  {
    title: "Getting manifests",
    task(ctx) {
      return new Listr([
        {
          title: "Getting GitHub Action manifest",
          async task() {
            ctx.gitHubActionManifest = await GitHubActionManifest.resolve(
              ctx.cwd
            );
          },
        },
        {
          title: "Getting Node package manifest",
          enabled() {
            return !ctx.gitHubActionManifest;
          },
          async task() {
            ctx.nodePackageManifest = await NodePackageManifest.resolve(
              ctx.cwd
            );
          },
        },
      ]);
    },
  },

  {
    title: "Creating bundles from Node package manifest",
    enabled({ nodePackageManifest }) {
      return !!nodePackageManifest;
    },
    task({ cwd, nodePackageManifest }) {
      const manifest = /** @type {NodePackageManifest} */ (nodePackageManifest);

      return new Listr([
        {
          title: "Creating CommonJS output",
          task(_, task) {
            if (!manifest.nodeEntry) {
              task.skip(`"main" field is empty.`);
              return;
            }

            return bundleNodeCJS({
              cwd,
              outputFile: manifest.nodeEntry,
              targetVersion: manifest.nodeTarget,
              externalDependencies: manifest.nodeDependencies,
            });
          },
        },
      ]);
    },
  },

  {
    title: "Creating bundle from GitHub Action manifest",

    enabled({ gitHubActionManifest }) {
      return !!gitHubActionManifest;
    },
    task({ cwd, gitHubActionManifest }, task) {
      const manifest = /** @type {GitHubActionManifest} */ (
        gitHubActionManifest
      );

      if (!manifest.entry) {
        task.skip(`"runs.main" field is empty`);
        return;
      }

      return bundleGitHubAction({
        cwd,
        outputFile: manifest.entry,
        targetVersion: manifest.target,
      });
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
    process.exitCode = 1;
    if (error instanceof StandardError) console.error(error.message);
    else console.error(error);
  }
};
