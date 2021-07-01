import { setErrorMap, ZodError, ZodIssueCode } from "zod";

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

/**
 * @param {import('zod').ZodIssueBase} issue
 * @returns {string}
 */
function formatZodIssue(issue) {
  return `'.${issue.path.join(".")}': ${issue.message}`;
}

/**
 * @param {import('zod').ZodError} error
 * @returns {Generator<string, number, void>}
 */
function* extractZodErrors(error) {
  let issues = 0;

  for (const issue of error.issues) {
    if (issue.code === ZodIssueCode.invalid_union) {
      /** @type {import('zod').ZodInvalidTypeIssue[]} */
      const typeIssues = [];
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
  /**
   * @param {string} message
   * @param {Error} originalError
   */
  constructor(message, originalError) {
    let errorMessage = originalError.message;

    if (originalError instanceof ZodError) {
      errorMessage = Array.from(extractZodErrors(originalError)).join("\n");
    }

    if (errorMessage.includes("\n")) {
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
