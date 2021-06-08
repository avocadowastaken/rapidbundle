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
  try {
    const content = await fs.readFile(packagePath, "utf-8");
    return packageJSONSchema.parse(JSON.parse(content));
  } catch (error) {
    throw new ValidationError("Invalid 'package.json'", error);
  }
}

/**
 * @param {string} cwd
 * @returns {Promise<undefined | PackageJSON>}
 */
export async function tryParsePackageJSON(cwd) {
  const packagePath = path.join(cwd, "package.json");
  return (await isFile(packagePath)) ? readPackageJSON(packagePath) : undefined;
}
