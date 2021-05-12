"use strict";

const path = require("path");
const semver = require("semver");
const { promises: fs } = require("fs");

const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");

const log = createLogger("manifest", "node-package");

/** @param {string} filePath */
async function readJSON(filePath) {
  try {
    const json = await fs.readFile(filePath, "utf-8");
    return JSON.parse(json);
  } catch {
    throw new Error(`Failed to parse ${filePath}`);
  }
}

/**
 * @typedef {object} PackageJSON
 * @property {string} [main]
 * @property {string} [module]
 * @property {{ node?: string }} [engines]
 * @property {Record<string, string>} [dependencies]
 * @property {Record<string, string>} [peerDependencies]
 * @property {Record<string, string>} [optionalDependencies]
 */

module.exports = class NodePackageManifest {
  /**
   * @param {string} pkgPath
   * @returns {Promise<NodePackageManifest>}
   */
  static async read(pkgPath) {
    log("reading file from: %s", pkgPath);
    const pkg = await readJSON(pkgPath);
    log("parsing file from: %s", pkgPath);
    return new NodePackageManifest(pkgPath, pkg);
  }

  /**
   * @param {string} input
   * @returns {Promise<undefined | NodePackageManifest>}
   */
  static async resolve(input) {
    log("reading package from: %s", input);
    const pkgPath = await findUpFile(input, "package.json");
    if (!pkgPath) {
      log("failed to resolve package.json from %s", input);
      return undefined;
    }

    log("resolved package: %s", pkgPath);
    return this.read(pkgPath);
  }

  /**
   * @param {string} pkgPath
   * @param {PackageJSON} pkg
   */
  constructor(pkgPath, pkg) {
    const pkgDir = path.dirname(pkgPath);

    /**
     * Absolute path of the "main" field
     *
     * @type {string | undefined}
     */
    this.nodeEntry =
      typeof pkg.main != "string" ? undefined : path.join(pkgDir, pkg.main);

    /**
     * Minimal version of the "engines.node" field
     *
     * @type {string }
     */
    this.nodeTarget = "12";

    if (pkg.engines && typeof pkg.engines.node == "string") {
      const minVersion = semver.minVersion(pkg.engines.node);

      if (!minVersion) {
        throw new Error("Invalid manifest: failed to parse `engines.version`");
      }

      this.nodeTarget = minVersion.version;
    }

    /**
     * List of "dependency" field keys
     *
     * @type {string[]}
     */
    this.nodeDependencies = Object.keys({
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.optionalDependencies,
    });

    /**
     * Absolute path of the "module" field
     *
     * @type {string | undefined}
     */
    this.browserModule =
      typeof pkg.module != "string" ? undefined : path.join(pkgDir, pkg.module);
  }
};
