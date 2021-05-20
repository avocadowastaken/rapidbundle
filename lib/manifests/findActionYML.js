"use strict";

const YAML = require("yaml");
const path = require("path");
const t = require("typanion");
const { promises: fs } = require("fs");

const isFile = require("../utils/isFile");
const assertType = require("../utils/assertType");
const createLogger = require("../utils/createLogger");

const log = createLogger("manifest", "action-yml");

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
 * @param {string} cwd
 * @returns {Promise<undefined | FindActionYMLResult>}
 */
module.exports = async function findActionYML(cwd) {
  log("reading manifest from: %s", cwd);
  const manifestPath = path.join(cwd, "action.yml");
  if (!(await isFile(manifestPath))) {
    log("failed to resolve action.yml from: %s", cwd);
    return undefined;
  }
  log("reading file: %s", manifestPath);
  const actionYML = await readYAML(manifestPath);
  assertType(isActionYAML, actionYML, "Invalid 'action.yml'");
  log("resolved manifest: %o", actionYML);
  return { actionYML, actionDir: path.dirname(manifestPath) };
};
