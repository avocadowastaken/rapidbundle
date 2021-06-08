import { promises as fs } from "fs";
import path from "path";
import YAML from "yaml";
import { z } from "zod";
import { isFile } from "../utils/fs.js";
import { ValidationError } from "../utils/validation.js";

const actionEntrySchema = z.string().refine(
  (value) => path.posix.normalize(value).startsWith("dist/"),
  (value) => ({
    message: `expected to be in the 'dist' directory, received '${value}'`,
  })
);

const actionYAMLSchema = z.object({
  runs: z.object({
    main: actionEntrySchema,
    pre: actionEntrySchema.optional(),
    post: actionEntrySchema.optional(),

    using: z.enum(["node12", "node14", "node16"]),
  }),
});

/**
 * @param {string} manifestPath
 * @returns {Promise<ActionYML>}
 */
async function readActionYML(manifestPath) {
  const content = await fs.readFile(manifestPath, "utf-8");
  return actionYAMLSchema.parse(YAML.parse(content));
}

/** @typedef {z.infer<typeof actionYAMLSchema>} ActionYML */

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

  if (await isFile(manifestPath)) {
    try {
      return { actionDir: cwd, actionYML: await readActionYML(manifestPath) };
    } catch (error) {
      throw new ValidationError("Invalid 'action.yml'", error);
    }
  }

  return undefined;
}
