import fs from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { z } from "zod";
import {
  addCustomIssue,
  entryPathSchema,
  ValidationError,
} from "../utils/validation";

export type PackageJSON = z.infer<typeof packageJSONSchema>;
const packageJSONSchema = z.object({
  bin: z.preprocess(
    (input) => (typeof input == "string" ? { "": input } : input),
    z
      .record(entryPathSchema)
      .refine(
        (bin) => Object.keys(bin).length > 0,
        "Expected to have at least one command"
      )
      .optional()
  ),
  main: entryPathSchema.optional(),
  types: entryPathSchema.optional(),
  module: entryPathSchema.optional(),

  type: z.enum(["module", "commonjs"]).default("commonjs"),

  engines: z
    .object({
      node: z
        .string()

        .transform((value, ctx) => {
          const version = semver.minVersion(value, true);
          if (!version) {
            return addCustomIssue(ctx, `Invalid semver range: ${value}`);
          }
          return version.format();
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
