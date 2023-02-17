import TaskTree from "tasktree-cli";
import type { TaskContext } from "./ctx";
import { ActionYML, tryParseActionYML } from "./manifests/ActionYML";
import { PackageJSON, tryParsePackageJSON } from "./manifests/PackageJSON";
import { bundleGitHubAction } from "./tasks/bundleGitHubAction";
import { bundleNodePackage } from "./tasks/bundleNodePackage";
import { rmrf } from "./utils/fs";
import { getDistDir } from "./utils/path";
import { runTask, runTaskTree } from "./utils/task";
import { ValidationError } from "./utils/validation";

async function resolveBuildManifests(
  cwd: string,
  tree: TaskTree
): Promise<[undefined | ActionYML, undefined | PackageJSON]> {
  return runTask(tree.add("Resolving build manifests"), async function* () {
    yield "Checking 'action.yml'";
    const parsedActionYML = await tryParseActionYML(cwd);

    yield "Checking 'package.json'";
    const parsedPackageJSON = await tryParsePackageJSON(cwd);

    if (!parsedActionYML && !parsedPackageJSON) {
      throw new ValidationError(
        "Manifest file (package.json or action.yml) not found."
      );
    }

    return [parsedActionYML, parsedPackageJSON];
  });
}

async function runPreparations(cwd: string, tree: TaskTree) {
  return runTask(tree.add("Run preparations"), async function* () {
    yield "Removing 'dist' directory";
    await rmrf(getDistDir(cwd));
  });
}

export async function run(ctx: TaskContext): Promise<void> {
  const tree = TaskTree.tree();
  return runTaskTree(tree, ctx, async () => {
    const { cwd, ci } = ctx;
    const [actionYML, packageJSON] = await resolveBuildManifests(cwd, tree);

    await runPreparations(cwd, tree);

    if (actionYML) {
      await bundleGitHubAction(cwd, ci, tree, actionYML);
    }

    if (packageJSON) {
      await bundleNodePackage(cwd, tree, packageJSON);
    }
  });
}
