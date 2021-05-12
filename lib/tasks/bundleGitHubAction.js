"use strict";

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
 * @param {GitHubActionBundleOptions} options
 */
module.exports = async function bundleGitHubAction(options) {
  log("building with options: %o", options);

  const { metafile } = await esbuild.build({
    logLevel: "silent",

    bundle: true,
    metafile: true,
    keepNames: true,
    platform: "node",

    outfile: options.outputFile,
    target: options.targetVersion,
    entryPoints: [options.entryPoint],

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  });

  log("successfully built: %O", metafile);
};
