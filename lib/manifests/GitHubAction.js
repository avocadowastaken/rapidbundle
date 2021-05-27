import { promises as fs } from "fs";
import path from "path";
import YAML from "yaml";
import { z } from "zod";
import { isFile } from "../utils/fs.js";
import { parseType } from "../utils/validation.js";

/** @typedef {z.infer<typeof ActionYAML>} ActionYML */

export const ActionYAML = z.object({
  runs: z.object({
    using: z.enum(["node12", "node14", "node16"]),
    main: z
      .string()
      .min(0)
      .refine(
        (value) => path.posix.normalize(value).startsWith("dist/"),
        (value) => ({
          message: `Expected to be in the 'dist' directory, received '${value}'`,
        })
      ),
  }),
});

/** @param {string} filePath */
async function readYAML(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return YAML.parse(content);
  } catch {
    throw new Error(`Failed to parse ${path.basename(filePath)}`);
  }
}

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
  return {
    actionDir: path.dirname(manifestPath),
    actionYML: await parseType(
      "Invalid 'action.yml'",
      ActionYAML,
      readYAML(manifestPath)
    ),
  };
}
