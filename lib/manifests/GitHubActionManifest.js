"use strict";

const path = require("path");
const YAML = require("yaml");
const { promises: fs } = require("fs");

const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");
const StandardError = require("../utils/StandardError");

const log = createLogger("manifest", "node-package");

/** @param {string} filePath */
async function readYAML(filePath) {
  try {
    const yaml = await fs.readFile(filePath, "utf-8");
    return YAML.parse(yaml);
  } catch {
    throw new StandardError(`Failed to parse ${filePath}`);
  }
}

/**
 * @typedef {object} GitHubActionYAML
 * @property {{ using?: string, main?: string }} [runs]
 */

module.exports = class GitHubActionManifest {
  /**
   * @param {string} manifestPath
   * @returns {Promise<GitHubActionManifest>}
   */
  static async read(manifestPath) {
    log("reading file from: %s", manifestPath);
    const manifest = await readYAML(manifestPath);
    log("parsing file from: %s", manifestPath);
    return new GitHubActionManifest(manifestPath, manifest);
  }

  /**
   * @param {string} input
   * @returns {Promise<undefined | GitHubActionManifest>}
   */
  static async resolve(input) {
    log("reading manifest from: %s", input);
    const manifestPath = await findUpFile(input, "action.yml");
    if (!manifestPath) {
      log("failed to resolve action.yml from %s", input);
      return undefined;
    }
    log("resolved manifest: %s", manifestPath);
    return this.read(manifestPath);
  }

  /**
   * @param {string} manifestPath
   * @param {GitHubActionYAML} manifest
   */
  constructor(manifestPath, manifest) {
    /**
     * Absolute path of the "main" field
     *
     * @type {string | undefined}
     */
    this.entry = undefined;

    /**
     * Minimal version of the "engines.node" field
     *
     * @type {string | undefined}
     */
    this.target = undefined;

    if (manifest.runs) {
      if (typeof manifest.runs.main == "string") {
        const manifestDir = path.dirname(manifestPath);

        this.entry = path.join(manifestDir, manifest.runs.main);
      }

      if (typeof manifest.runs.using == "string") {
        this.target = manifest.runs.using;
      }
    }
  }
};
