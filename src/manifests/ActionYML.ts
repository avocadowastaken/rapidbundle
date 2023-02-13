import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { isFile } from "../utils/fs";
import { ValidationError } from "../utils/validation";

const actionEntrySchema = z.string().refine(
  (value) => path.posix.normalize(value).startsWith("dist/"),
  (value) => ({
    message: `expected to be in the 'dist' directory, received '${value}'`,
  })
);

export type ActionYML = z.infer<typeof actionYMLSchema>;
const actionYMLSchema = z.object({
  runs: z.object({
    main: actionEntrySchema,
    pre: actionEntrySchema.optional(),
    post: actionEntrySchema.optional(),

    using: z.enum(["node12", "node16"]),
  }),
});

async function readActionYML(manifestPath: string): Promise<ActionYML> {
  try {
    const yaml = await import("js-yaml");
    const content = await fs.readFile(manifestPath, "utf-8");
    return actionYMLSchema.parse(yaml.load(content));
  } catch (error) {
    throw new ValidationError("Invalid 'action.yml'", error);
  }
}

export async function tryParseActionYML(
  cwd: string
): Promise<undefined | ActionYML> {
  const manifestPath = path.join(cwd, "action.yml");
  return (await isFile(manifestPath)) ? readActionYML(manifestPath) : undefined;
}
