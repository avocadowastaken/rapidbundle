"use strict";

const Listr = require("listr");

const StandardError = require("./utils/StandardError");

const NodePackageManifest = require("./manifests/NodePackageManifest");
const GitHubActionManifest = require("./manifests/GitHubActionManifest");

const BuildNodeTask = require("./tasks/BuildNodeTask");
const BuildGitHubActionTask = require("./tasks/BuildGitHubActionTask");

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
          skip() {
            return !manifest.nodeEntry;
          },
          task() {
            return new BuildNodeTask(manifest, { cwd }).run();
          },
        },
      ]);
    },
  },

  {
    title: "Creating bundle from GitHub Action manifest",
    skip({ gitHubActionManifest }) {
      return !gitHubActionManifest?.entry;
    },
    enabled({ gitHubActionManifest }) {
      return !!gitHubActionManifest;
    },
    task({ cwd, gitHubActionManifest }) {
      const manifest = /** @type {GitHubActionManifest} */ (
        gitHubActionManifest
      );

      return new BuildGitHubActionTask(manifest, { cwd }).run();
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
