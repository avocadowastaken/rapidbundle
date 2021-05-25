"use strict";

const path = require("path");

const findNodePackage = require("./manifests/findNodePackage");
const findGitHubAction = require("./manifests/findGitHubAction");

const bundleTypes = require("./tasks/bundleTypes");
const bundleNodeCJS = require("./tasks/bundleNodeCJS");
const bundleBrowserESM = require("./tasks/bundleBrowserESM");
const bundleGitHubAction = require("./tasks/bundleGitHubAction");

const isFile = require("./utils/isFile");
const Logger = require("./utils/Logger");
const CLIError = require("./utils/CLIError");

async function main() {
  const cwd = process.cwd();
  const logger = new Logger(process.stdout);
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
      bundleGitHubAction(
        entryPoint,
        gitHubAction.actionDir,
        gitHubAction.actionYML
      )
    );
  }

  if (nodePackage) {
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

module.exports = main().catch(() => {
  process.exitCode = 1;
});
