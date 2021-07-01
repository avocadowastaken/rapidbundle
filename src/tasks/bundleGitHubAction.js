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
    outdir: resolveDistDir(cwd),

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  };

  {
    const mainEntry = resolveEntry(cwd, actionYML.runs.main);
    options.entryPoints = [mainEntry];
    yield "Using '.runs.main' entry: " + formatRelativePath(cwd, mainEntry);

    if (actionYML.runs.pre) {
      const preEntry = resolveEntry(cwd, actionYML.runs.pre);
      yield "Using '.runs.pre' entry: " + formatRelativePath(cwd, preEntry);
      options.entryPoints.push(preEntry);
    }

    if (actionYML.runs.post) {
      const postEntry = resolveEntry(cwd, actionYML.runs.post);
      yield "Using '.runs.post' entry: " + formatRelativePath(cwd, postEntry);
      options.entryPoints.push(postEntry);
    }
  }

  {
    options.target = actionYML.runs.using;
    yield `Using '.runs.using' entry: ${options.target}`;
  }

  await esbuild.build(options);
}
