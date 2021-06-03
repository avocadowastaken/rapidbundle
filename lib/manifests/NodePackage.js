import { promises as fs } from "fs";
import path from "path";
import {
  isDict,
  isObject,
  isOneOf,
  isOptional,
  isString,
  isUnknown,
} from "typanion";
import { assertType } from "../utils/assertType.js";
import { CLIError } from "../utils/CLIError.js";
import { isFile } from "../utils/fs.js";

const isPackageJSON = isObject(
  {
    main: isOptional(isString()),
    types: isOptional(isString()),
    module: isOptional(isString()),

    engines: isOptional(
      isObject({ node: isOptional(isString()) }, { extra: isUnknown() })
    ),

    exports: isOptional(isOneOf([isString(), isDict(isUnknown())])),

    dependencies: isOptional(isDict(isString())),
    peerDependencies: isOptional(isDict(isString())),
    optionalDependencies: isOptional(isDict(isString())),
  },
  { extra: isUnknown() }
);

/** @param {string} filePath */
async function readJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    throw new CLIError(`Failed to parse ${filePath}`);
  }
}

/** @typedef {import('typanion').InferType<typeof isPackageJSON>} PackageJSON */

/**
 * @typedef {object} NodePackage
 * @property {string} packageDir
 * @property {PackageJSON} packageJSON
 */

/**
 * @param {string} cwd
 * @returns {Promise<undefined | NodePackage>}
 */
export async function findNodePackage(cwd) {
  const packagePath = path.join(cwd, "package.json");
  if (!(await isFile(packagePath))) return undefined;
  const packageJSON = await readJSON(packagePath);
  assertType(isPackageJSON, packageJSON, "Invalid 'package.json'");
  return { packageJSON, packageDir: path.dirname(packagePath) };
}
