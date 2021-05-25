"use strict";

const path = require("path");
const assert = require("assert");
const semver = require("semver");
const esbuild = require("esbuild");

/**
 * @param {string} entryPoint
 * @param {string} packageDir
 * @param {import("../manifests/findNodePackage").PackageJSON} packageJSON
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

  await esbuild.build({
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    target,
    outfile,
    external,
    entryPoints: [entryPoint],
  });
};
