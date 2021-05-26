import { promises as fs } from "fs";
import path from "path";
import { isEnum, isObject, isString, isUnknown } from "typanion";
import YAML from "yaml";
import { assertType } from "../utils/assertType.js";
import { CLIError } from "../utils/CLIError.js";
import { isFile } from "../utils/isFile.js";

const isActionYAML = isObject(
  {
    runs: isObject({
      main: isString(),
      using: isEnum(["node12"]),
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
    throw new CLIError(`Failed to parse ${filePath}`);
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
