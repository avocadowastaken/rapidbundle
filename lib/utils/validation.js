/**
 * @param {import('zod').ZodError} error
 * @returns {string[]}
 */
export function extractZodErrors(error) {
  return error.errors.flatMap(
    (issue) => `.${issue.path.join(".")}: ${issue.message}`
  );
}

/**
 * @template {unknown} TOutput
 * @param {string} message
 * @param {import('zod').ZodType<TOutput>} type
 * @param {unknown} value
 * @returns {Promise<TOutput>}
 */
export async function parseType(message, type, value) {
  const result = await type.safeParseAsync(await value);

  if (!result.success) {
    const errors = extractZodErrors(result.error);

    throw new Error(
      [`${message}:`, ...errors.map((error) => `  ${error}`)].join("\n")
    );
  }

  return result.data;
}
