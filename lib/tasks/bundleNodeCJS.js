"use strict";

const path = require("path");
const esbuild = require("esbuild");

const createLogger = require("../utils/createLogger");
const log = createLogger("build", "task", "node", "cjs");

/**
 * @typedef {object} NodeCJSBundleOptions
 * @property {string} cwd
 * @property {string} outputFile
 * @property {string} targetVersion
 * @property {string} [entryPoint]
 * @property {string[]} [externalDependencies]
 */

/**
 * @param {NodeCJSBundleOptions} options
 * @returns {Promise<void>}
 */
module.exports = async function bundleNodeCJS(options) {
  log("building with options: %o", options);

  const { metafile } = await esbuild.build({
    bundle: true,
    metafile: true,
    keepNames: true,
    platform: "node",
    outfile: options.outputFile,
    target: `node${options.targetVersion}`,
    external: options.externalDependencies,
    entryPoints: [options.entryPoint || path.join(options.cwd, "src")],
  });

  log("successfully built: %O", metafile);
};
