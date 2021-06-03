export class CLIError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "CLIError";
  }
}

/**
 * @template {unknown} U
 * @template {U} V
 * @param {import("typanion").StrictTest<U, V>} isValid
 * @param {U} value
 * @param {string} [message]
 * @returns {asserts value is V}
 */
export function assertType(isValid, value, message = "Invalid type") {
  /** @type {string[]} */
  const errors = [];

  if (!isValid(value, { errors })) {
    throw new CLIError(
      `${message}:\n${errors.map((error) => `  ${error}`).join("\n")}`
    );
  }
}
