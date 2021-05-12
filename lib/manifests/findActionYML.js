"use strict";

const YAML = require("yaml");
const t = require("typanion");
const { promises: fs } = require("fs");

const assertType = require("../utils/assertType");
const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");

const log = createLogger("manifest", "github-action");

const isGitHubActionYAML = t.isObject(
  {
    runs: t.isObject({
      main: t.isString(),
      using: t.isEnum(["node12"]),
    }),
  },
  { extra: t.isUnknown() }
);

/** @param {string} filePath */
async function readYAML(filePath) {
  try {
    const yaml = await fs.readFile(filePath, "utf-8");
    return YAML.parse(yaml);
  } catch {
    throw new Error(`Failed to parse ${filePath}`);
  }
}

/**
 * @typedef {t.InferType<typeof isGitHubActionYAML>} ActionYML
 */

/**
 * @typedef {object} FindActionYMLResult
 * @property {string} path
 * @property {ActionYML} actionYML
 */

/**
 * @param {string} input
 * @returns {Promise<undefined | FindActionYMLResult>}
 */
module.exports = async function findActionYML(input) {
  log("reading manifest from: %s", input);
  const manifestPath = await findUpFile(input, "action.yml");
  if (!manifestPath) {
    log("failed to resolve action.yml from: %s", input);
    return undefined;
  }
  log("reading file: %s", manifestPath);
  const actionYML = await readYAML(manifestPath);
  assertType(isGitHubActionYAML, actionYML, "Invalid 'action.yml'");
  log("resolved manifest: %o", actionYML);
  return { path: manifestPath, actionYML: actionYML };
};
