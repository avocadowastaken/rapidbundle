"use strict";

const YAML = require("yaml");
const path = require("path");
const t = require("typanion");
const { promises: fs } = require("fs");

const assertType = require("../utils/assertType");
const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");

const log = createLogger("manifest", "github-action");

const isActionYAML = t.isObject(
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
    const content = await fs.readFile(filePath, "utf-8");
    return YAML.parse(content);
  } catch {
    throw new Error(`Failed to parse ${filePath}`);
  }
}

/** @typedef {t.InferType<typeof isActionYAML>} ActionYML */

/**
 * @typedef {object} FindActionYMLResult
 * @property {string} actionDir
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
  assertType(isActionYAML, actionYML, "Invalid 'action.yml'");
  log("resolved manifest: %o", actionYML);
  return { actionYML, actionDir: path.dirname(manifestPath) };
};
