import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { entryPathSchema, ValidationError } from "../utils/validation";

export type ActionYML = z.infer<typeof actionYMLSchema>;
const actionYMLSchema = z.object({
  runs: z.object({
    main: entryPathSchema,
    pre: entryPathSchema.optional(),
    post: entryPathSchema.optional(),
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
