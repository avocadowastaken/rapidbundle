"use strict";

const path = require("path");
const Listr = require("listr");
const { promises: fs } = require("fs");

const bundleNodeCJS = require("./tasks/bundleNodeCJS");
const bundleGitHubAction = require("./tasks/bundleGitHubAction");
const bundleBrowserESM = require("./tasks/bundleBrowserESM");

const findActionYML = require("./manifests/findActionYML");
const findPackageJSON = require("./manifests/findPackageJSON");
const bundleTypes = require("./tasks/bundleTypes");
const createLogger = require("./utils/createLogger");

const log = createLogger();

/**
 * @typedef {object} CliContext
 * @property {string} cwd
 * @property {string} entryPoint
 * @property {boolean} [skipNodePackage]
 */

/** @type {Listr<CliContext>} */
const tasks = new Listr([
  {
    title: "Resolving entry point",
    async task(ctx, task) {
      const srcDir = path.join(ctx.cwd, "src");

      task.output = `Resolving from: ${srcDir}`;
      log("resolving entry point from: %s", srcDir);

      for (const ext of ["tsx", "ts", "esm", "js"]) {
        const entry = path.join(srcDir, `index.${ext}`);

        log("checking file stats of: %s", entry);

        try {
          const stat = await fs.stat(entry);

          if (stat.isFile()) {
            ctx.entryPoint = entry;
            task.output = `Resolved: ${ctx.entryPoint}`;
            break;
          }
        } catch (e) {
          log("failed to check stats: ", e);
        }
      }

      if (!ctx.entryPoint) {
        throw new Error(`Failed to resolve entry from: ${ctx.cwd}.`);
      }
    },
  },

  {
    title: "Creating GitHub action bundle",
    async task(ctx, task) {
      const action = await findActionYML(ctx.cwd);

      if (!action) {
        task.skip("Action not found");
        return;
      }

      ctx.skipNodePackage = true;

      return bundleGitHubAction(
        ctx.entryPoint,
        action.actionDir,
        action.actionYML
      );
    },
  },

  {
    title: "Creating Node package bundles",
    enabled({ skipNodePackage }) {
      return !skipNodePackage;
    },
    async task(ctx, task) {
      const pkg = await findPackageJSON(ctx.cwd);

      if (!pkg) {
        task.skip("Package not found");
        return;
      }

      const { entryPoint } = ctx;
      const { packageDir, packageJSON } = pkg;

      return new Listr([
        {
          title: "Creating Node (CJS) bundle",
          enabled() {
            return !!packageJSON.main;
          },
          task() {
            return bundleNodeCJS(entryPoint, packageDir, packageJSON);
          },
        },

        {
          title: "Creating Browser (ESM) bundle",
          enabled() {
            return !!packageJSON.module;
          },
          task() {
            return bundleBrowserESM(entryPoint, packageDir, packageJSON);
          },
        },

        {
          title: "Creating Type declarations",
          enabled() {
            return !!packageJSON.types;
          },
          task() {
            return bundleTypes(entryPoint, packageDir, packageJSON);
          },
        },
      ]);
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
