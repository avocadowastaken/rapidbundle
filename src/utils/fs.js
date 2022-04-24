import fs from "node:fs/promises";

/**
 * @param {string} input
 * @returns {Promise<void>}
 */
export function rmrf(input) {
  return fs.rm(input, { force: true, recursive: true });
}

/**
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export async function isFile(input) {
  try {
    const stat = await fs.stat(input);
    return stat.isFile();
  } catch {
    return false;
  }
}
