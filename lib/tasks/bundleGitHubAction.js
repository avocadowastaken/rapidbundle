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
 * @param {string} cwd
 * @param {import("../manifests/ActionYML.js").ActionYML} actionYML
 * @returns {AsyncGenerator<string, void>}
 */
export async function* bundleGitHubAction(cwd, actionYML) {
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
    options.entryPoints = [resolveEntry(cwd, actionYML.runs.main)];

    if (actionYML.runs.pre) {
      options.entryPoints.push(resolveEntry(cwd, actionYML.runs.pre));
    }

    if (actionYML.runs.post) {
      options.entryPoints.push(resolveEntry(cwd, actionYML.runs.post));
    }

    yield `Using entry points: ${options.entryPoints
      .map((x) => formatRelativePath(cwd, x))
      .join(", ")}`;
  }

  {
    options.outdir = resolveDistDir(cwd);
    yield `Using output directory: ${formatRelativePath(cwd, options.outdir)}`;
  }

  {
    options.target = actionYML.runs.using;
    yield `Using Node version: ${options.target}`;
  }

  await esbuild.build(options);
}
