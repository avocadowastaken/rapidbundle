"use strict";

const path = require("path");
const Listr = require("listr");
const assert = require("assert");

const resolveEntry = require("./utils/resolveEntry");

const bundleNodeCJS = require("./tasks/bundleNodeCJS");
const bundleGitHubAction = require("./tasks/bundleGitHubAction");
const bundleBrowserESM = require("./tasks/bundleBrowserESM");

const findActionYML = require("./manifests/findActionYML");
const findPackageJSON = require("./manifests/findPackageJSON");

/**
 * @typedef {object} CliContext
 * @property {string} cwd
 * @property {string} entryPoint
 * @property {import('./manifests/findActionYML').FindActionYMLResult} [actionYMLResult]
 * @property {import('./manifests/findPackageJSON').FindPackageJSONResult} [packageJSONResult]
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
        throw new Error(`Failed to resolve entry from: ${ctx.cwd}.`);
      }

      task.output = `Resolved: ${ctx.entryPoint}`;
    },
  },

  {
    title: "Getting GitHub Action manifest",
    async task(ctx) {
      ctx.actionYMLResult = await findActionYML(ctx.cwd);
    },
  },

  {
    title: "Creating bundle from GitHub Action manifest",
    enabled({ actionYMLResult }) {
      return !!actionYMLResult;
    },
    task({ entryPoint, actionYMLResult }) {
      assert(actionYMLResult);
      return bundleGitHubAction(
        entryPoint,
        actionYMLResult.actionDir,
        actionYMLResult.actionYML
      );
    },
  },

  {
    title: "Getting Node package manifest",
    enabled({ actionYMLResult }) {
      return !actionYMLResult;
    },
    async task(ctx) {
      ctx.packageJSONResult = await findPackageJSON(ctx.cwd);
    },
  },

  {
    title: "Creating Node CJS bundle",
    enabled({ packageJSONResult }) {
      return !!packageJSONResult;
    },
    task({ entryPoint, packageJSONResult }, task) {
      assert(packageJSONResult);

      const { packageDir, packageJSON } = packageJSONResult;

      if (!packageJSON.main) {
        task.skip(`"main" field is empty.`);
        return;
      }

      return bundleNodeCJS(entryPoint, packageDir, packageJSON);
    },
  },

  {
    title: "Creating Browser ESM bundle",
    enabled({ packageJSONResult }) {
      return !!packageJSONResult;
    },
    task({ entryPoint, packageJSONResult }, task) {
      assert(packageJSONResult);

      const { packageDir, packageJSON } = packageJSONResult;

      if (!packageJSON.module) {
        task.skip(`"module" field is empty.`);
        return;
      }

      return bundleBrowserESM(entryPoint, packageDir, packageJSON);
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
