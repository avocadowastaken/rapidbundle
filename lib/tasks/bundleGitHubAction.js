import esbuild from "esbuild";
import path from "path";
import { resolveEntry } from "../utils/path.js";

/**
 * @typedef {object} GitHubActionBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 * @property {string} targetVersion
 */

/**
 * @param {import("../manifests/GitHubAction.js").GitHubAction} action
 */
export async function bundleGitHubAction(action) {
  const { actionYML, actionDir } = action;
  const { main, using: target } = actionYML.runs;

  const outfile = path.join(actionDir, main);
  const entryPoint = resolveEntry(actionDir, outfile);

  await esbuild.build({
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    target,
    outfile,

    entryPoints: [entryPoint],

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  });
}
