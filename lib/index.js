import assert from "assert";
import Listr from "listr";
import path from "path";
import { tryParseActionYML } from "./manifests/ActionYML.js";
import { tryParsePackageJSON } from "./manifests/PackageJSON.js";
import { bundleGitHubAction } from "./tasks/bundleGitHubAction.js";
import { bundleNodePackage } from "./tasks/bundleNodePackage.js";
import { rmrf } from "./utils/fs.js";

/**
 * @typedef {object} TasksContext
 * @property {string} cwd
 * @property {import('./manifests/PackageJSON.js').PackageJSON} [packageJSON]
 * @property {import('./manifests/ActionYML.js').ActionYML} [actionYML]
 */

/** @type {Listr<TasksContext>} */
const tasks = new Listr([
  {
    title: "Resolving build manifests",
    async task(ctx, task) {
      task.output = "Checking 'action.yml'";
      ctx.actionYML = await tryParseActionYML(ctx.cwd);
      task.output = "Checking 'package.json'";
      ctx.packageJSON = await tryParsePackageJSON(ctx.cwd);

      if (!ctx.actionYML && !ctx.packageJSON) {
        throw new Error(
          "Manifest file (package.json or action.yml) not found."
        );
      }
    },
  },

  {
    title: "Run preparations",
    async task(ctx, task) {
      task.output = "Removing 'dist' directory";
      await rmrf(path.join(ctx.cwd, "dist"));
    },
  },

  {
    title: "Running GitHub Action bundler",
    enabled(ctx) {
      return !!ctx.actionYML;
    },
    async task(ctx, task) {
      assert(ctx.actionYML);

      for await (const output of bundleGitHubAction(ctx.cwd, ctx.actionYML)) {
        task.output = output;
      }
    },
  },

  {
    title: "Running Node Package bundler",
    enabled(ctx) {
      return !!ctx.packageJSON;
    },
    task(ctx) {
      assert(ctx.packageJSON);
      return bundleNodePackage(ctx.cwd, ctx.packageJSON);
    },
  },
]);

tasks.run({ cwd: process.cwd() }).catch(() => {
  process.exitCode = 1;
});
