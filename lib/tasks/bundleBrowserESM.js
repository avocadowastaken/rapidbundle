"use strict";

const esbuild = require("esbuild");

const createLogger = require("../utils/createLogger");
const log = createLogger("build", "task", "browser", "esm");

/** npx browserslist --json --mobile-to-desktop "> 0.5%, last 2 versions, Firefox ESR, not dead, not IE 11" */
const stableBrowsers = ["chrome 88", "edge 89", "firefox 78", "safari 14.1"];
const esBuildTargets = stableBrowsers.map((browser) =>
  browser.replace(" ", "")
);

/**
 * @typedef {object} BrowserEMSBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 */

/**
 * @param {BrowserEMSBundleOptions} options
 * @returns {Promise<void>}
 */
module.exports = async function bundleBrowserESM(options) {
  log("building with options: %o", options);

  const { metafile } = await esbuild.build({
    bundle: true,
    metafile: true,
    format: "esm",
    platform: "browser",

    target: esBuildTargets,
    outfile: options.outputFile,
    entryPoints: [options.entryPoint],
  });

  log("successfully built: %O", metafile);
};
