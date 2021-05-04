import * as path from "path";
import { findParentFile, readJSON } from "../utils/fs";
import { createLogger } from "../utils/Logger";
import { StandardError } from "../utils/StandardError";
import semver = require("semver");

const log = createLogger("manifest", "node-package");

export interface PackageJSON {
  main?: string;
  engines?: { node?: string };
  dependencies?: { [key: string]: string };
  peerDependencies?: { [key: string]: string };
  optionalDependencies?: { [key: string]: string };
}

export class NodePackageManifest {
  static parsePkg(pkgPath: string, pkg: PackageJSON): NodePackageManifest {
    const pkgDir = path.dirname(pkgPath);
    const manifest = new NodePackageManifest();

    if (typeof pkg.main == "string") {
      manifest.nodeEntry = path.join(pkgDir, pkg.main);
    }

    if (typeof pkg.engines?.node == "string") {
      const minVersion = semver.minVersion(pkg.engines.node);

      if (!minVersion) {
        throw new StandardError(
          "Invalid manifest: failed to parse `engines.version`"
        );
      }

      manifest.nodeTarget = minVersion.version;
    }

    manifest.nodeDependencies = Object.keys({
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.optionalDependencies,
    });

    return manifest;
  }

  static async readPkg(pkgPath: string): Promise<NodePackageManifest> {
    log("reading file from: %s", pkgPath);
    const pkg = await readJSON<PackageJSON>(pkgPath);
    return this.parsePkg(pkgPath, pkg);
  }

  static async findPkg(input: string): Promise<NodePackageManifest> {
    log("reading package from: %s", input);

    if (!path.isAbsolute(input)) {
      input = path.resolve(input);
      log("normalize to absolute path: %s", input);
    }

    let pkgPath: string = input;

    if (path.basename(input) !== "package.json") {
      log("looking for the closest directory to: %s", input);
      pkgPath = await findParentFile(input, "package.json");
    }

    return this.readPkg(pkgPath);
  }

  /** absolute path of the "main" field */
  nodeEntry?: string;
  /** minimal version of the "engines.node" field */
  nodeTarget?: string;
  /** list of "dependency" field keys */
  nodeDependencies?: string[];
}
