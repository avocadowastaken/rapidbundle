import { promises as fs } from "fs";

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
