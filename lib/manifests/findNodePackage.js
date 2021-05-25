"use strict";

const path = require("path");
const t = require("typanion");
const { promises: fs } = require("fs");

const isFile = require("../utils/isFile");
const assertType = require("../utils/assertType");

const isPackageJSON = t.isObject(
  {
    main: t.isOptional(t.isString()),
    types: t.isOptional(t.isString()),
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

/** @typedef {t.InferType<typeof isPackageJSON>} PackageJSON */

/**
 * @typedef {object} NodePackage
 * @property {string} packageDir
 * @property {PackageJSON} packageJSON
 */

/**
 * @param {string} cwd
 * @returns {Promise<undefined | NodePackage>}
 */
module.exports = async function findNodePackage(cwd) {
  const packagePath = path.join(cwd, "package.json");
  if (!(await isFile(packagePath))) return undefined;
  const packageJSON = await readJSON(packagePath);
  assertType(isPackageJSON, packageJSON, "Invalid 'package.json'");
  return { packageJSON, packageDir: path.dirname(packagePath) };
};
