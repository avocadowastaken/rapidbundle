import { build } from "esbuild";
import * as path from "path";
import { NodePackageManifest } from "../manifests/NodePackageManifest";
import { BuildTask, BuildTaskOptions } from "./BuildTask";

export interface BuildNodeOptions extends BuildTaskOptions {
  manifest: NodePackageManifest;
}

export class BuildNodeTask extends BuildTask {
  readonly #manifest: NodePackageManifest;

  constructor({ manifest, ...options }: BuildNodeOptions) {
    super("node", options);
    this.#manifest = manifest;
  }

  async run(): Promise<void> {
    const {
      nodeEntry,
      nodeTarget = "12",
      nodeDependencies = [],
    } = this.#manifest;

    if (!nodeEntry) {
      this.log("skipping build, reason: empty node entry");
      return;
    }

    this.log("building with options: %o", { nodeEntry, nodeTarget });

    await build({
      bundle: true,
      keepNames: true,
      platform: "node",
      outfile: nodeEntry,
      target: `node${nodeTarget}`,
      external: nodeDependencies,
      entryPoints: [path.join(this.cwd, "src")],
    });
  }
}
