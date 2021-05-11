const path = require("path");
const esbuild = require("esbuild");
const BuildTask = require("./BuildTask");
const StandardError = require("../utils/StandardError");

module.exports = class BuildNodeTask extends BuildTask {
  /**
   * @param manifest {import("../manifests/NodePackageManifest")}
   * @param options {import('./BuildTask').BuildTaskOptions}
   */
  constructor(manifest, options) {
    super("node", options);

    /**
     * @type {import("../manifests/NodePackageManifest")}
     * @readonly
     * @protected
     */
    this.manifest = manifest;
  }

  async run() {
    const { nodeEntry, nodeDependencies, nodeTarget = "12" } = this.manifest;

    if (!nodeEntry) {
      throw new StandardError("Invalid manifest: `nodeEntry` is empty.");
    }

    this.log("building with options: %o", { nodeEntry, nodeTarget });

    const { metafile } = await esbuild.build({
      bundle: true,
      metafile: true,
      keepNames: true,
      platform: "node",
      outfile: nodeEntry,
      target: `node${nodeTarget}`,
      external: nodeDependencies,
      entryPoints: [path.join(this.cwd, "src")],
    });

    this.log("successfully built: %O", metafile);
  }
};
