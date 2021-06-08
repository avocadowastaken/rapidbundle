import assert from "assert";
import esbuild from "esbuild";
import path from "path";
import { resolveSrcDir } from "../utils/path.js";

/**
 * Npx browserslist --json --mobile-to-desktop "> 0.5%, last 2 versions, Firefox
 * ESR, not dead, not IE 11"
 */
const stableBrowsers = ["chrome 88", "edge 89", "firefox 78", "safari 14.1"];
const target = stableBrowsers.map((browser) => browser.replace(" ", ""));

/**
 * @typedef {object} BrowserEMSBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 */

/**
 * @param {string} cwd
 * @param {import("../manifests/PackageJSON.js").PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
export async function bundleBrowserESM(cwd, packageJSON) {
  assert(packageJSON.module);
  await esbuild.build({
    bundle: true,
    format: "esm",
    platform: "browser",

    target,
    entryPoints: [path.join(resolveSrcDir(cwd), "index")],
    outfile: path.join(cwd, packageJSON.module),
    external: Object.keys({
      ...packageJSON.dependencies,
      ...packageJSON.peerDependencies,
      ...packageJSON.optionalDependencies,
    }),
  });
}
