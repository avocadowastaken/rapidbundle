"use strict";

const path = require("path");
const t = require("typanion");
const { promises: fs } = require("fs");

const assertType = require("../utils/assertType");
const findUpFile = require("../utils/findUpFile");
const createLogger = require("../utils/createLogger");

const log = createLogger("manifest", "github-action");

const isPackageJSON = t.isObject(
  {
    main: t.isOptional(t.isString()),
    module: t.isOptional(t.isString()),

    engines: t.isOptional(
      t.isObject({ node: t.isOptional(t.isString()) }, { extra: t.isUnknown() })
    ),

    dependencies: t.isOptional(t.isDict(t.isString())),
    peerDependencies: t.isOptional(t.isDict(t.isString())),
    optionalDependencies: t.isOptional(t.isDict(t.isString())),
  },
  { extra: t.isUnknown() }
);

/** @param {string} filePath */
async function readJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    throw new Error(`Failed to parse ${filePath}`);
  }
}

/**
 * @typedef {t.InferType<typeof isPackageJSON>} PackageJSON
 */

/**
 * @typedef {object} FindPackageJSONResult
 * @property {string} packageDir
 * @property {PackageJSON} packageJSON
 */

/**
 * @param {string} input
 * @returns {Promise<undefined | FindPackageJSONResult>}
 */
module.exports = async function findPackageJSON(input) {
  log("reading manifest from: %s", input);
  const packagePath = await findUpFile(input, "package.json");
  if (!packagePath) {
    log("failed to resolve package.json from: %s", input);
    return undefined;
  }
  log("reading file: %s", packagePath);
  const packageJSON = await readJSON(packagePath);
  assertType(isPackageJSON, packageJSON, "Invalid 'package.json'");
  log("resolved manifest: %o", packageJSON);
  return { packageJSON, packageDir: path.dirname(packagePath) };
};
