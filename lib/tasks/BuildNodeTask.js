const path = require("path");
const esbuild = require("esbuild");
const BuildTask = require("./BuildTask");
const StandardError = require("../utils/StandardError");

module.exports = class BuildNodeTask extends BuildTask {
  /**
   * @type {import("../manifests/NodePackageManifest")}
   * @readonly
   */
  #manifest;

  /**
   * @param manifest {import("../manifests/NodePackageManifest")}
   * @param options {import('./BuildTask').BuildTaskOptions}
   */
  constructor(manifest, options) {
    super("node", options);
    this.#manifest = manifest;
  }

  async run() {
    const {
      nodeEntry,
      nodeTarget = "12",
      nodeDependencies = [],
    } = this.#manifest;

    if (!nodeEntry) {
      throw new StandardError("Invalid manifest: `nodeEntry` is empty.");
    }

    this.log("building with options: %o", { nodeEntry, nodeTarget });

    const { errors, warnings, metafile } = await esbuild.build({
      bundle: true,
      metafile: true,
      keepNames: true,
      platform: "node",
      outfile: nodeEntry,
      target: `node${nodeTarget}`,
      external: nodeDependencies,
      entryPoints: [path.join(this.cwd, "src")],
    });

    if (errors.length) {
      this.log("built with %i errors: %O", errors.length, errors);
    }

    if (warnings.length) {
      this.log("built with %i warnings: %O", warnings.length, warnings);
    }

    if (metafile) {
      this.log("successfully built: %O", metafile);
    }
  }
};
