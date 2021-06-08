import { promises as fs } from "fs";
import path from "path";
import semver from "semver";
import { z } from "zod";
import { isFile } from "../utils/fs.js";
import { ValidationError } from "../utils/validation.js";

const packageEntrySchema = z.string().refine(
  (value) => path.posix.normalize(value).startsWith("dist/"),
  (value) => ({
    message: `expected to be in the 'dist' directory, received '${value}'`,
  })
);

const packageJSONSchema = z.object({
  main: packageEntrySchema.optional(),
  types: packageEntrySchema.optional(),
  module: packageEntrySchema.optional(),

  engines: z
    .object({
      node: z
        .string()
        .default("12")
        .transform((value) => {
          const version = semver.minVersion(value, true);
          if (version) return version.format();
          throw new Error(`invalid semver range: ${value}`);
        }),
    })
    .default({}),

  dependencies: z.record(z.string()).default({}),
  peerDependencies: z.record(z.string()).default({}),
  optionalDependencies: z.record(z.string()).default({}),
});

/** @typedef {z.infer<typeof packageJSONSchema>} PackageJSON */

/**
 *  @param {string} packagePath
 *  @returns {Promise<PackageJSON>}
 */
async function readPackageJSON(packagePath) {
  const content = await fs.readFile(packagePath, "utf-8");
  return packageJSONSchema.parse(JSON.parse(content));
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
  if (await isFile(packagePath)) {
    try {
      return {
        packageDir: cwd,
        packageJSON: await readPackageJSON(packagePath),
      };
    } catch (error) {
      throw new ValidationError("Invalid 'package.json'", error);
    }
  }

  return undefined;
}
