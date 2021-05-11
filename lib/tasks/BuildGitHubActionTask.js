const path = require("path");
const esbuild = require("esbuild");
const BuildTask = require("./BuildTask");
const StandardError = require("../utils/StandardError");

module.exports = class BuildGitHubActionTask extends BuildTask {
  /**
   * @param manifest {import("../manifests/GitHubActionManifest")}
   * @param options {import('./BuildTask').BuildTaskOptions}
   */
  constructor(manifest, options) {
    super("node", options);

    /**
     * @type {import("../manifests/GitHubActionManifest")}
     * @readonly
     * @protected
     */
    this.manifest = manifest;
  }

  async run() {
    const { entry, target = "node12" } = this.manifest;

    if (!entry) {
      throw new StandardError("Invalid manifest: `entry` is empty.");
    }

    this.log("building with options: %o", { entry, target });

    const { metafile } = await esbuild.build({
      bundle: true,
      metafile: true,
      keepNames: true,
      platform: "node",

      target,
      outfile: entry,
      entryPoints: [path.join(this.cwd, "src")],

      external: [
        // Optional dependency of the `node-fetch`.
        "encoding",
      ],
    });

    this.log("successfully built: %O", metafile);
  }
};
