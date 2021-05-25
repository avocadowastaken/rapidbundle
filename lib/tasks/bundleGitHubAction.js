"use strict";

const path = require("path");
const esbuild = require("esbuild");

/**
 * @typedef {object} GitHubActionBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 * @property {string} targetVersion
 */

/**
 * @param {string} entryPoint
 * @param {string} actionDir
 * @param {import("../manifests/findGitHubAction").ActionYML} actionYML
 */
module.exports = async function bundleGitHubAction(
  entryPoint,
  actionDir,
  actionYML
) {
  await esbuild.build({
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    entryPoints: [entryPoint],

    target: actionYML.runs.using,
    outfile: path.join(actionDir, actionYML.runs.main),

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  });
};
