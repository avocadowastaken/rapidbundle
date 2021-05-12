"use strict";

const path = require("path");
const assert = require("assert");
const semver = require("semver");
const esbuild = require("esbuild");

const createLogger = require("../utils/createLogger");
const log = createLogger("build", "task", "node", "cjs");

/**
 * @param {string} entryPoint
 * @param {string} packageDir
 * @param {import('../manifests/findPackageJSON').PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
module.exports = async function bundleNodeCJS(
  entryPoint,
  packageDir,
  packageJSON
) {
  assert(packageJSON.main);

  let target = "node12";
  const outfile = path.join(packageDir, packageJSON.main);
  const external = Object.keys({
    ...packageJSON.dependencies,
    ...packageJSON.peerDependencies,
    ...packageJSON.optionalDependencies,
  });

  if (packageJSON.engines && packageJSON.engines.node) {
    const minVersion = semver.minVersion(packageJSON.engines.node);

    if (!minVersion) {
      throw new Error("Invalid manifest: failed to parse `engines.version`");
    }

    target = `node${minVersion.toString()}`;
  }

  log("bundling with options: %O", { target, entryPoint, outfile, external });

  const { metafile } = await esbuild.build({
    logLevel: "silent",

    bundle: true,
    metafile: true,
    keepNames: true,
    platform: "node",

    target,
    outfile,
    external,
    entryPoints: [entryPoint],
  });

  log("successfully built: %O", metafile);
};
