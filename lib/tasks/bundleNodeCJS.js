import assert from "assert";
import esbuild from "esbuild";
import path from "path";
import semver from "semver";
import { resolveSrcDir } from "../utils/path.js";

/**
 * @param {import("../manifests/NodePackage.js").NodePackage} nodePackage
 * @returns {Promise<void>}
 */
export async function bundleNodeCJS(nodePackage) {
  const { packageDir, packageJSON } = nodePackage;

  assert(packageJSON.main);

  let target = "node12";

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
    entryPoints: [path.join(resolveSrcDir(packageDir), "index")],
    outfile: path.join(packageDir, packageJSON.main),
    external: Object.keys({
      ...packageJSON.dependencies,
      ...packageJSON.peerDependencies,
      ...packageJSON.optionalDependencies,
    }),
  });
}
