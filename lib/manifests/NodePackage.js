import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { isFile } from "../utils/fs.js";
import { parseType } from "../utils/validation.js";
import { getMinVersion, isValidVersion } from "../utils/version.js";

/** @typedef {z.infer<typeof PackageJSON>} PackageJSON */

export const PackageJSON = z.object({
  types: z.string().optional(),
  exports: z.union([z.string(), z.record(z.unknown())]),
  engines: z
    .object({
      node: z
        .string()
        .transform((value) => getMinVersion(value) || value)
        .refine(isValidVersion, "Invalid version")
        .optional(),
    })
    .optional(),
  dependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  optionalDependencies: z.record(z.string()).optional(),
});

/** @param {string} filePath */
async function readJSON(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

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
  return {
    packageDir: path.dirname(packagePath),
    packageJSON: await parseType(
      "Invalid 'package.json'",
      PackageJSON,
      readJSON(packagePath)
    ),
  };
}
