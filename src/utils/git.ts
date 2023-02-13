import { exec } from "./exec";

export async function gitCommand(...args: string[]): Promise<string> {
  const [stdout] = await exec("git", args, { stderr: "inherit" });
  return stdout;
}

export async function gitStatus(directory: string): Promise<string> {
  return gitCommand("status", "--porcelain", directory);
}

export async function gitDiff(directory: string): Promise<string> {
  return gitCommand("diff", "--minimal", "--unified=0", directory);
}
