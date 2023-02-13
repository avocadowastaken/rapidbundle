import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
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

export async function tryParseActionYML(
  cwd: string
): Promise<undefined | ActionYML> {
  try {
    const manifestPath = path.join(cwd, "action.yml");
    const yaml = await import("js-yaml");
    const content = await fs.readFile(manifestPath, "utf-8");
    return actionYMLSchema.parse(yaml.load(content));
  } catch (error) {
    ValidationError.process("Invalid 'action.yml'", error);
    return undefined;
  }
}
