"use strict";

const path = require("path");
const YAML = require("yaml");
const t = require("typanion");
const { promises: fs } = require("fs");

const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");
const assertType = require("../utils/assertType");

const log = createLogger("manifest", "node-package");

/** @param {string} filePath */
async function readYAML(filePath) {
  try {
    const yaml = await fs.readFile(filePath, "utf-8");
    return YAML.parse(yaml);
  } catch {
    throw new Error(`Failed to parse ${filePath}`);
  }
}

const isGitHubActionYAML = t.isObject(
  {
    runs: t.isObject({
      main: t.isString(),
      using: t.isEnum(["node12"]),
    }),
  },
  { extra: t.isUnknown() }
);

module.exports = class GitHubActionManifest {
  /**
   * @param {string} manifestPath
   * @returns {Promise<GitHubActionManifest>}
   */
  static async read(manifestPath) {
    log("reading file from: %s", manifestPath);
    const yaml = await readYAML(manifestPath);
    log("parsing file from: %s", manifestPath);

    assertType(isGitHubActionYAML, yaml, "Invalid 'action.yml'");

    const entry = path.join(path.dirname(manifestPath), yaml.runs.main);
    return new GitHubActionManifest(entry, yaml.runs.using);
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
   * @param {string} entry
   * @param {string} target
   */
  constructor(entry, target) {
    /**
     * Absolute path of the "main" field.
     * @type {string}
     * @readonly
     */
    this.entry = entry;

    /**
     * Minimal version of the "using" field.
     * @type {string}
     * @readonly
     */
    this.target = target;
  }
};
