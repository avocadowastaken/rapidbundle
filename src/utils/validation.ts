import path from "node:path";
import { z } from "zod";

z.setErrorMap((issue, ctx) => {
  let message = ctx.defaultError;

  if (
    issue.code === z.ZodIssueCode.invalid_type &&
    issue.received === z.ZodParsedType.undefined
  ) {
    message =
      message = `Expected ${issue.expected}, received ${issue.received}`;
  }

  return { message };
});

function* collectZodFormattedErrors(
  { _errors, ...fields }: z.ZodFormattedError<Record<string, unknown>>,
  pathPrefix = ""
): Generator<string, void> {
  for (const error of _errors) {
    yield `'${pathPrefix}': ${error}`;
  }

  for (const [field, fieldErrors] of Object.entries(fields)) {
    if (fieldErrors) {
      yield* collectZodFormattedErrors(fieldErrors, `${pathPrefix}.${field}`);
    }
  }
}

function formatZodError(error: z.ZodError): string {
  let output = "";
  const formatted = error.format() as z.ZodFormattedError<
    Record<string, unknown>
  >;

  for (const error of collectZodFormattedErrors(formatted)) {
    output += `\n${error}`;
  }

  return output;
}

function formatErrorMessage(message: string, errorReason?: Error): string {
  let reason = "";

  if (errorReason instanceof z.ZodError) {
    reason = formatZodError(errorReason);
  } else if (errorReason instanceof Error) {
    reason = errorReason.message;
  }

  if (!reason) {
    return message;
  }

  return `${message}: ${reason}`;
}

export class ValidationError extends Error {
  public static process(message: string, reason: unknown): void {
    if (!(reason instanceof Error)) {
      throw reason;
    }

    if (!("code" in reason) || reason.code !== "ENOENT") {
      throw new ValidationError(message, reason);
    }
  }

  constructor(message: string, reason?: Error) {
    super(formatErrorMessage(message, reason));
    this.name = "ValidationError";
  }
}

export function addCustomIssue(ctx: z.RefinementCtx, message: string): never {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message: message });
  return z.NEVER;
}

export const entryPathSchema = z
  .string()
  .min(1, "Expected to be a valid file path")
  .transform((input, ctx) => {
    const value = path.posix.normalize(input);
    if (!value.startsWith("dist/")) {
      return addCustomIssue(
        ctx,
        `Expected to be in the 'dist' directory, received '${input}'`
      );
    }
    return value;
  });
