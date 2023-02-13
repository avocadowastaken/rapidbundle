import fs from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { z } from "zod";
import { ValidationError } from "../utils/validation";

const packageEntrySchema = z
  .string()
  .min(1, "expected to be a valid file path, received, '\"\"'")
  .refine(
    (value) => path.posix.normalize(value).startsWith("dist/"),
    (value) => ({
      message: `expected to be in the 'dist' directory, received '${value}'`,
    })
  );

export type PackageJSON = z.infer<typeof packageJSONSchema>;
const packageJSONSchema = z.object({
  bin: z.preprocess(
    (input) => (typeof input == "string" ? { "": input } : input),
    z
      .record(packageEntrySchema)
      .refine(
        (bin) => Object.keys(bin).length > 0,
        "expected to have at least one command, received '{}'"
      )
      .optional()
  ),
  main: packageEntrySchema.optional(),
  types: packageEntrySchema.optional(),
  module: packageEntrySchema.optional(),

  type: z.enum(["module", "commonjs"]).optional(),

  engines: z
    .object({
      node: z
        .string()
        .transform((value) => {
          const version = semver.minVersion(value, true);
          if (version) return version.format();
          throw new Error(`invalid semver range: ${value}`);
        })
        .optional(),
    })
    .passthrough()
    .optional(),

  dependencies: z.record(z.string()).default({}),
  peerDependencies: z.record(z.string()).default({}),
  optionalDependencies: z.record(z.string()).default({}),
});

export async function tryParsePackageJSON(
  cwd: string
): Promise<undefined | PackageJSON> {
  try {
    const packagePath = path.join(cwd, "package.json");
    const content = await fs.readFile(packagePath, "utf-8");
    return packageJSONSchema.parse(JSON.parse(content));
  } catch (error) {
    ValidationError.process("Invalid 'package.json'", error);
    return undefined;
  }
}
