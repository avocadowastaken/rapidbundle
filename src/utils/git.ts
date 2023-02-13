import { exec } from "./exec";

/**
 * @param {string} directory
 * @returns {Promise<string>}
 */
export async function gitStatus(directory: string): Promise<string> {
  const [stdout] = await exec("git", ["status", "--porcelain", directory], {
    stderr: "inherit",
  });
  return stdout;
}

export async function gitDiff(directory: string): Promise<string> {
  const [stdout] = await exec(
    "git",
    ["diff", "--minimal", "--unified=0", directory],
    { stderr: "inherit" }
  );

  return stdout;
}
