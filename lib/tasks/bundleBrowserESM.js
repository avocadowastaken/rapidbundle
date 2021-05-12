"use strict";

const path = require("path");
const assert = require("assert");
const esbuild = require("esbuild");

const createLogger = require("../utils/createLogger");
const log = createLogger("build", "task", "browser", "esm");

/** npx browserslist --json --mobile-to-desktop "> 0.5%, last 2 versions, Firefox ESR, not dead, not IE 11" */
const stableBrowsers = ["chrome 88", "edge 89", "firefox 78", "safari 14.1"];
const target = stableBrowsers.map((browser) => browser.replace(" ", ""));

/**
 * @typedef {object} BrowserEMSBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 */

/**
 * @param {string} entryPoint
 * @param {string} packageDir
 * @param {import('../manifests/findPackageJSON').PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
module.exports = async function bundleBrowserESM(
  entryPoint,
  packageDir,
  packageJSON
) {
  assert(packageJSON.module);
  const outfile = path.join(packageDir, packageJSON.module);

  log("bundling with options: %O", { target, entryPoint, outfile });

  const { metafile } = await esbuild.build({
    bundle: true,
    metafile: true,
    format: "esm",
    platform: "browser",

    target,
    outfile,
    entryPoints: [entryPoint],
  });

  log("successfully built: %O", metafile);
};
