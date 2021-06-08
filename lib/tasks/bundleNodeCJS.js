import assert from "assert";
import esbuild from "esbuild";
import path from "path";
import { resolveSrcDir } from "../utils/path.js";

/**
 * @param {string} cwd
 * @param {import("../manifests/PackageJSON.js").PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
export async function bundleNodeCJS(cwd, packageJSON) {
  assert(packageJSON.main);

  const target = `node${packageJSON.engines.node}`;

  await esbuild.build({
    logLevel: "silent",

    bundle: true,
    keepNames: true,
    platform: "node",

    target,
    entryPoints: [path.join(resolveSrcDir(cwd), "index")],
    outfile: path.join(cwd, packageJSON.main),
    external: Object.keys({
      ...packageJSON.dependencies,
      ...packageJSON.peerDependencies,
      ...packageJSON.optionalDependencies,
    }),
  });
}
