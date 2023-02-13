import { Listr } from "listr2";
import assert from "node:assert";
import { ActionYML, tryParseActionYML } from "./manifests/ActionYML";
import { PackageJSON, tryParsePackageJSON } from "./manifests/PackageJSON";
import { bundleGitHubAction } from "./tasks/bundleGitHubAction";
import { bundleNodePackage } from "./tasks/bundleNodePackage";
import { rmrf } from "./utils/fs";
import { getDistDir } from "./utils/path";

type TasksContext = {
  cwd: string;
  actionYML: undefined | ActionYML;
  packageJSON: undefined | PackageJSON;
};

const tasks = new Listr<TasksContext>(
  [
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
        await rmrf(getDistDir(ctx.cwd));
      },
    },

    {
      title: "Making bundle from 'action.yml'",
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
      title: "Making bundle from 'package.json'",
      enabled(ctx) {
        return !!ctx.packageJSON;
      },
      task(ctx) {
        assert(ctx.packageJSON);
        return bundleNodePackage(ctx.cwd, ctx.packageJSON);
      },
    },
  ],
  {
    rendererOptions: {
      collapse: false,
      clearOutput: false,
      showSubtasks: true,
    },
  }
);

tasks
  .run({ cwd: process.cwd(), actionYML: undefined, packageJSON: undefined })
  .catch(() => {
    process.exitCode = 1;
  });
