"use strict";

const path = require("path");
const Listr = require("listr");

const NodePackageManifest = require("./manifests/NodePackageManifest");
const GitHubActionManifest = require("./manifests/GitHubActionManifest");

const bundleNodeCJS = require("./tasks/bundleNodeCJS");
const bundleGitHubAction = require("./tasks/bundleGitHubAction");
const bundleBrowserESM = require("./tasks/bundleBrowserESM");
const resolveEntry = require("./utils/resolveEntry");

/**
 * @typedef {object} CliContext
 * @property {string} cwd
 * @property {string} entryPoint
 * @property {NodePackageManifest} [nodePackageManifest]
 * @property {GitHubActionManifest} [gitHubActionManifest]
 */

/** @type {Listr<CliContext>} */
const tasks = new Listr([
  {
    title: "Getting entry point",
    async task(ctx, task) {
      const dirs = ["src", "lib", "."];

      for (const dir of dirs) {
        const dirPath = path.join(ctx.cwd, dir);
        task.output = `Resolving from: ${dirPath}`;
        const entry = await resolveEntry(dirPath, ctx.cwd).catch(() => null);

        if (entry) {
          ctx.entryPoint = entry;
          break;
        }
      }

      if (!ctx.entryPoint) {
        throw new Error(`Failed to resolve entry in ${ctx.cwd}.`);
      }

      task.output = `Resolved: ${ctx.entryPoint}`;
    },
  },

  {
    title: "Getting GitHub Action manifest",
    async task(ctx) {
      ctx.gitHubActionManifest = await GitHubActionManifest.resolve(ctx.cwd);
    },
  },

  {
    title: "Creating bundle from GitHub Action manifest",
    enabled({ gitHubActionManifest }) {
      return !!gitHubActionManifest;
    },
    task({ entryPoint, gitHubActionManifest }, task) {
      const manifest = /** @type {GitHubActionManifest} */ (
        gitHubActionManifest
      );

      if (!manifest.entry) {
        task.skip(`"runs.main" field is empty`);
        return;
      }

      return bundleGitHubAction({
        entryPoint,
        outputFile: manifest.entry,
        targetVersion: manifest.target,
      });
    },
  },

  {
    title: "Getting Node package manifest",
    enabled({ gitHubActionManifest }) {
      return !gitHubActionManifest;
    },
    async task(ctx) {
      ctx.nodePackageManifest = await NodePackageManifest.resolve(ctx.cwd);
    },
  },

  {
    title: "Creating Node CJS bundle",
    enabled({ nodePackageManifest }) {
      return !!nodePackageManifest;
    },
    task({ entryPoint, nodePackageManifest }, task) {
      const manifest = /** @type {NodePackageManifest} */ (nodePackageManifest);

      if (!manifest.nodeEntry) {
        task.skip(`"main" field is empty.`);
        return;
      }

      return bundleNodeCJS({
        entryPoint,
        outputFile: manifest.nodeEntry,
        targetVersion: manifest.nodeTarget,
        externalDependencies: manifest.nodeDependencies,
      });
    },
  },

  {
    title: "Creating Browser ESM bundle",
    enabled({ nodePackageManifest }) {
      return !!nodePackageManifest;
    },
    task({ entryPoint, nodePackageManifest }, task) {
      const manifest = /** @type {NodePackageManifest} */ (nodePackageManifest);

      if (!manifest.browserModule) {
        task.skip(`"module" field is empty.`);
        return;
      }

      return bundleBrowserESM({
        entryPoint,
        outputFile: manifest.browserModule,
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
    await tasks.run({ cwd, entryPoint: "" });
  } catch (error) {
    process.exitCode = 1;
  }
};
