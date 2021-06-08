import { setErrorMap, ZodError, ZodIssueCode } from "zod";

setErrorMap((error, ctx) => {
  if (error.code === ZodIssueCode.invalid_type) {
    return {
      message: `expected "${error.expected}", received "${error.received}"`,
    };
  }

  if (error.code === ZodIssueCode.invalid_enum_value) {
    return {
      message: `expected ${error.options
        .map((option) => `"${option}"`)
        .join(" or ")} but received "${ctx.data}"`,
    };
  }

  return { message: ctx.defaultError };
});

export class ValidationError extends Error {
  /**
   * @param {string} message
   * @param {Error} originalError
   */
  constructor(message, originalError) {
    let errorMessage = originalError.message;

    if (originalError instanceof ZodError) {
      errorMessage = originalError.issues
        .map((issue) => `.${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
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
