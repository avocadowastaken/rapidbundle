import path from "path";
import { findGitHubAction } from "./manifests/findGitHubAction.js";
import { findNodePackage } from "./manifests/findNodePackage.js";
import { bundleBrowserESM } from "./tasks/bundleBrowserESM.js";
import { bundleGitHubAction } from "./tasks/bundleGitHubAction.js";
import { bundleNodeCJS } from "./tasks/bundleNodeCJS.js";
import { bundleTypes } from "./tasks/bundleTypes.js";
import { CLIError } from "./utils/CLIError.js";
import { isFile } from "./utils/fs.js";
import { Logger } from "./utils/Logger.js";

async function main() {
  const cwd = process.cwd();
  const logger = new Logger(process.stdout);

  const [nodePackage, gitHubAction] = await logger.time(
    "Resolving build manifests",
    async () => {
      const [pkg, action] = await Promise.all([
        findNodePackage(cwd),
        findGitHubAction(cwd),
      ]);

      if (!pkg && !action) {
        throw new CLIError(
          "Manifest file (package.json or action.yml) not found."
        );
      }

      return [pkg, action];
    }
  );

  if (gitHubAction) {
    await logger.time("Creating GitHub action bundle", () =>
      bundleGitHubAction(gitHubAction)
    );
  }

  if (nodePackage) {
    const entryPoint = await logger.time("Resolving entry point", async () => {
      const srcDir = path.join(cwd, "src");
      const extensions = ["tsx", "ts", "esm", "js"];

      for (const ext of ["tsx", "ts", "esm", "js"]) {
        const entry = path.join(srcDir, `index.${ext}`);
        if (await isFile(entry)) return entry;
      }

      throw new CLIError(
        [
          "Failed to resolve entry point.",
          "  Checked:",
          ...extensions.map((ext) => `  - src/index.${ext}`),
        ].join("\n")
      );
    });

    const { packageDir, packageJSON } = nodePackage;

    if (packageJSON.main) {
      await logger.time("Creating Node (CJS) bundle", () =>
        bundleNodeCJS(entryPoint, packageDir, packageJSON)
      );
    }

    if (packageJSON.module) {
      await logger.time("Creating Browser (ESM) bundle", () =>
        bundleBrowserESM(entryPoint, packageDir, packageJSON)
      );
    }

    if (packageJSON.types) {
      await logger.time("Creating Type declarations", () =>
        bundleTypes(packageDir, packageJSON)
      );
    }
  }
}

main().catch(() => {
  process.exitCode = 1;
});
