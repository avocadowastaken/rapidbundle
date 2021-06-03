import { promises as fs } from "fs";
import path from "path";
import { isEnum, isObject, isOptional, isString, isUnknown } from "typanion";
import YAML from "yaml";
import { isFile } from "../utils/fs.js";
import { assertType } from "../utils/validation.js";

const isActionYAML = isObject(
  {
    runs: isObject({
      main: isString(),
      using: isEnum(["node12"]),
      pre: isOptional(isString()),
      post: isOptional(isString()),
    }),
  },
  { extra: isUnknown() }
);

/** @param {string} filePath */
async function readYAML(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return YAML.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse ${filePath}`);
  }
}

/** @typedef {import("typanion").InferType<typeof isActionYAML>} ActionYML */

/**
 * @typedef {object} GitHubAction
 * @property {string} actionDir
 * @property {ActionYML} actionYML
 */

/**
 * @param {string} cwd
 * @returns {Promise<undefined | GitHubAction>}
 */
export async function findGitHubAction(cwd) {
  const manifestPath = path.join(cwd, "action.yml");
  if (!(await isFile(manifestPath))) return undefined;
  const actionYML = await readYAML(manifestPath);
  assertType(isActionYAML, actionYML, "Invalid 'action.yml'");
  return { actionYML, actionDir: path.dirname(manifestPath) };
}
