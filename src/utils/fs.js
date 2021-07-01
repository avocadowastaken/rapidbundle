import { promises as fs } from "fs";
import rimraf from "rimraf";

/**
 * @param {string} input
 * @returns {Promise<void>}
 */
export function rmrf(input) {
  return new Promise((resolve, reject) => {
    rimraf(input, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
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
