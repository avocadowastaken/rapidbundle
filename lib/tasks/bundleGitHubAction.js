import esbuild from "esbuild";
import {
  formatRelativePath,
  resolveDistDir,
  resolveEntry,
} from "../utils/path.js";

/**
 * @typedef {object} GitHubActionBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 * @property {string} targetVersion
 */

/**
 * @param {import("../manifests/GitHubAction.js").GitHubAction} action
 * @returns {AsyncGenerator<string, void>}
 */
export async function* bundleGitHubAction(action) {
  const { actionDir, actionYML } = action;

  /** @type {esbuild.BuildOptions}*/
  const options = {
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  };

  {
    options.entryPoints = [resolveEntry(actionDir, actionYML.runs.main)];

    if (actionYML.runs.pre) {
      options.entryPoints.push(resolveEntry(actionDir, actionYML.runs.pre));
    }

    if (actionYML.runs.post) {
      options.entryPoints.push(resolveEntry(actionDir, actionYML.runs.post));
    }

    yield `Using entry points: ${options.entryPoints
      .map((x) => formatRelativePath(actionDir, x))
      .join(", ")}`;
  }

  {
    options.outdir = resolveDistDir(actionDir);
    yield `Using output directory: ${formatRelativePath(
      actionDir,
      options.outdir
    )}`;
  }

  {
    options.target = actionYML.runs.using;
    yield `Using Node version: ${options.target}`;
  }

  await esbuild.build(options);
}
