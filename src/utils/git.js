import { exec } from "./exec.js";

/**
 * @param {string} directory
 * @returns {Promise<string>}
 */
export async function gitStatus(directory) {
  const [stdout] = await exec("git", ["status", "--porcelain", directory], {
    stderr: "inherit",
  });
  return stdout;
}

/**
 * @param {string} directory
 * @returns {Promise<string>}
 */
export async function gitDiff(directory) {
  const [stdout] = await exec(
    "git",
    ["diff", "--minimal", "--unified=0", directory],
    { stderr: "inherit" }
  );

  return stdout;
}
