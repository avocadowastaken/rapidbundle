import TaskTree from "tasktree-cli";
import type { TaskContext } from "./ctx";
import { ActionYML, tryParseActionYML } from "./manifests/ActionYML";
import { PackageJSON, tryParsePackageJSON } from "./manifests/PackageJSON";
import { bundleGitHubAction } from "./tasks/bundleGitHubAction";
import { bundleNodePackage } from "./tasks/bundleNodePackage";
import { rmrf } from "./utils/fs";
import { getDistDir } from "./utils/path";
import { runTask } from "./utils/task";
import { ValidationError } from "./utils/validation";

async function resolveBuildManifests(
  tree: TaskTree,
  { cwd }: TaskContext
): Promise<[undefined | ActionYML, undefined | PackageJSON]> {
  const task = tree.add("Resolving build manifests");
  return runTask(task, async () => {
    task.log("Checking 'action.yml'");
    const parsedActionYML = await tryParseActionYML(cwd);

    task.log("Checking 'package.json'");
    const parsedPackageJSON = await tryParsePackageJSON(cwd);

    if (!parsedActionYML && !parsedPackageJSON) {
      throw new ValidationError(
        "Manifest file (package.json or action.yml) not found."
      );
    }

    return [parsedActionYML, parsedPackageJSON];
  });
}

async function runPreparations(tree: TaskTree, { cwd }: TaskContext) {
  const task = tree.add("Run preparations");
  return runTask(task, async () => {
    // TODO: Skip if `dist` dir not exists.
    task.log("Removing 'dist' directory");
    await rmrf(getDistDir(cwd));
  });
}

async function runTasks(tree: TaskTree, ctx: TaskContext) {
  const [actionYML, packageJSON] = await resolveBuildManifests(tree, ctx);

  await runPreparations(tree, ctx);

  if (actionYML) {
    await bundleGitHubAction(ctx.cwd, ctx.ci, tree, actionYML);
  }

  if (packageJSON) {
    await bundleNodePackage(ctx.cwd, tree, packageJSON);
  }
}

export async function run(ctx: TaskContext): Promise<void> {
  const { noTTY } = ctx;
  const tree = TaskTree.tree();
  try {
    tree.start({ silent: noTTY, autoClear: false });
    await runTasks(tree, ctx);
    tree.stop();
  } finally {
    if (noTTY) {
      console.log(tree.render().join("\n"));
    }
  }
}
