import {
  setErrorMap,
  ZodError,
  ZodInvalidTypeIssue,
  ZodIssueBase,
  ZodIssueCode,
} from "zod";

setErrorMap((error, ctx) => {
  switch (error.code) {
    case ZodIssueCode.invalid_type:
      return {
        message: `expected "${error.expected}", received "${error.received}"`,
      };

    case ZodIssueCode.invalid_enum_value:
      return {
        message: `expected ${error.options
          .map((option) => `"${option}"`)
          .join(" or ")} but received "${ctx.data}"`,
      };
  }

  return { message: ctx.defaultError };
});

function formatZodIssue(issue: ZodIssueBase): string {
  return `'.${issue.path.join(".")}': ${issue.message}`;
}

function* extractZodErrors(error: ZodError): Generator<string, number, void> {
  let issues = 0;

  for (const issue of error.issues) {
    if (issue.code === ZodIssueCode.invalid_union) {
      const typeIssues: ZodInvalidTypeIssue[] = [];
      let nonTypeIssues = 0;

      for (const unionError of issue.unionErrors) {
        for (const unionErrorIssue of unionError.issues) {
          if (unionErrorIssue.code === ZodIssueCode.invalid_type) {
            typeIssues.push(unionErrorIssue);
          } else {
            nonTypeIssues += yield* extractZodErrors(unionError);
          }
        }
      }

      if (nonTypeIssues > 0) {
        issues += nonTypeIssues;
      } else if (typeIssues.length) {
        for (const typeIssue of typeIssues) {
          issues++;
          yield formatZodIssue(typeIssue);
        }
      }
    } else {
      issues++;
      yield formatZodIssue(issue);
    }
  }

  return issues;
}

export class ValidationError extends Error {
  constructor(message: string, originalError: unknown) {
    const errorMessage =
      originalError instanceof ZodError
        ? Array.from(extractZodErrors(originalError)).join("\n")
        : originalError instanceof Error
        ? originalError.message
        : null;

    if (!errorMessage) {
      super(message);
    } else if (errorMessage.includes("\n")) {
      super(
        `${message}:\n${errorMessage
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n")}`
      );
    } else {
      super(`${message}: ${errorMessage}`);
    }

    this.name = "ValidationError";
  }
}
