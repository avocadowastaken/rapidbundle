"use strict";

const path = require("path");
const semver = require("semver");
const fs = require("fs/promises");

const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");
const StandardError = require("../utils/StandardError");

const log = createLogger("manifest", "node-package");

/** @param {string} filePath */
async function readJSON(filePath) {
  try {
    const json = await fs.readFile(filePath, "utf-8");
    return JSON.parse(json);
  } catch {
    throw new StandardError(`Failed to parse ${filePath}`);
  }
}

/**
 * @typedef {object} PackageJSON
 * @property {string} [main]
 * @property {{ node?: string }} [engines]
 * @property {Record<string, string>} [dependencies]
 * @property {Record<string, string>} [peerDependencies]
 * @property {Record<string, string>} [optionalDependencies]
 */

module.exports = class NodePackageManifest {
  /**
   * @param {string} pkgPath
   * @param {PackageJSON} pkg
   * @returns {NodePackageManifest}
   */
  static parsePkg(pkgPath, pkg) {
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

  /**
   * @param {string} pkgPath
   * @returns {Promise<NodePackageManifest>}
   */
  static async readPkg(pkgPath) {
    log("reading file from: %s", pkgPath);
    const pkg = await readJSON(pkgPath);
    return this.parsePkg(pkgPath, pkg);
  }

  /**
   * @param {string} input
   * @returns {Promise<NodePackageManifest>}
   */
  static async findPkg(input) {
    log("reading package from: %s", input);

    if (!path.isAbsolute(input)) {
      input = path.resolve(input);
      log("normalize to absolute path: %s", input);
    }

    let pkgPath = input;

    if (path.basename(input) !== "package.json") {
      log("looking for the closest directory to: %s", input);
      pkgPath = await findUpFile(input, "package.json");
    }

    return this.readPkg(pkgPath);
  }

  constructor() {
    /**
     * Absolute path of the "main" field
     *
     * @type {string | undefined}
     */
    this.nodeEntry = undefined;

    /**
     * Minimal version of the "engines.node" field
     *
     * @type {string | undefined}
     */
    this.nodeTarget = undefined;

    /**
     * List of "dependency" field keys
     *
     * @type {string[]}
     */
    this.nodeDependencies = [];
  }
};
