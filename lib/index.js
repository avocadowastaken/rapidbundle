import assert from "assert";
import Listr from "listr";
import path from "path";
import { findGitHubAction } from "./manifests/GitHubAction.js";
import { findNodePackage } from "./manifests/NodePackage.js";
import { bundleGitHubAction } from "./tasks/bundleGitHubAction.js";
import { bundleNodePackage } from "./tasks/bundleNodePackage.js";
import { rmrf } from "./utils/fs.js";

/**
 * @typedef {object} TasksContext
 * @property {string} cwd
 * @property {import('./manifests/NodePackage.js').NodePackage} [nodePackage]
 * @property {import('./manifests/GitHubAction.js').GitHubAction} [gitHubAction]
 */

/** @type {Listr<TasksContext>} */
const tasks = new Listr([
  {
    title: "Resolving build manifests",
    async task(ctx, task) {
      task.output = "Checking 'package.json'";
      ctx.nodePackage = await findNodePackage(ctx.cwd);
      task.output = "Checking 'action.yml'";
      ctx.gitHubAction = await findGitHubAction(ctx.cwd);

      if (!ctx.nodePackage && !ctx.gitHubAction) {
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
      return !!ctx.gitHubAction;
    },
    async task(ctx, task) {
      assert(ctx.gitHubAction);

      for await (const output of bundleGitHubAction(ctx.gitHubAction)) {
        task.output = output;
      }
    },
  },

  {
    title: "Running Node Package bundler",
    enabled(ctx) {
      return !!ctx.nodePackage;
    },
    task(ctx) {
      assert(ctx.nodePackage);
      return bundleNodePackage(ctx.nodePackage);
    },
  },
]);

tasks.run({ cwd: process.cwd() }).catch(() => {
  process.exitCode = 1;
});
