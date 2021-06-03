import esbuild from "esbuild";
import { rmrf } from "../utils/fs.js";
import { resolveDistDir, resolveEntry } from "../utils/path.js";

/**
 * @typedef {object} GitHubActionBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 * @property {string} targetVersion
 */

/**
 * @param {import("../manifests/findGitHubAction").GitHubAction} action
 * @returns {Promise<void>}
 */
export async function bundleGitHubAction(action) {
  const { actionDir, actionYML } = action;

  const entryPoints = [resolveEntry(actionDir, actionYML.runs.main)];

  if (actionYML.runs.pre) {
    entryPoints.push(resolveEntry(actionDir, actionYML.runs.pre));
  }

  if (actionYML.runs.post) {
    entryPoints.push(resolveEntry(actionDir, actionYML.runs.post));
  }

  const outdir = resolveDistDir(actionDir);

  await rmrf(outdir);

  await esbuild.build({
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    outdir,
    entryPoints,
    target: actionYML.runs.using,

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  });
}
