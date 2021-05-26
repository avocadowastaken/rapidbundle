import assert from "assert";
import esbuild from "esbuild";
import path from "path";
import semver from "semver";
import { CLIError } from "../utils/CLIError.js";

/**
 * @param {string} entryPoint
 * @param {string} packageDir
 * @param {import("../manifests/findNodePackage").PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
export async function bundleNodeCJS(entryPoint, packageDir, packageJSON) {
  assert(packageJSON.main);

  let target = "node12";

  if (packageJSON.engines && packageJSON.engines.node) {
    const minVersion = semver.minVersion(packageJSON.engines.node);

    if (!minVersion) {
      throw new CLIError("Invalid manifest: failed to parse `engines.version`");
    }

    target = `node${minVersion.toString()}`;
  }

  await esbuild.build({
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    target,
    entryPoints: [entryPoint],
    outfile: path.join(packageDir, packageJSON.main),
    external: Object.keys({
      ...packageJSON.dependencies,
      ...packageJSON.peerDependencies,
      ...packageJSON.optionalDependencies,
    }),
  });
}
