"use strict";

const path = require("path");
const esbuild = require("esbuild");

const createLogger = require("../utils/createLogger");
const log = createLogger("build", "task", "github-action");

/**
 * @typedef {object} GitHubActionBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 * @property {string} targetVersion
 */

/**
 * @param {string} entryPoint
 * @param {string} actionDir
 * @param {import("../manifests/findActionYML").ActionYML} actionYML
 */
module.exports = async function bundleGitHubAction(
  entryPoint,
  actionDir,
  actionYML
) {
  const { metafile } = await esbuild.build({
    logLevel: "silent",

    bundle: true,
    metafile: true,
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

  log("successfully built: %O", metafile);
};
