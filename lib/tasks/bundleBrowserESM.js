"use strict";

const path = require("path");
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
 * @property {string} cwd
 * @property {string} outputFile
 * @property {string} [entryPoint]
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
    entryPoints: [options.entryPoint || path.join(options.cwd, "src")],
  });

  log("successfully built: %O", metafile);
};
