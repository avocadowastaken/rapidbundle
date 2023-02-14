import { exec } from "./exec";
import { ValidationError } from "./validation";

export async function git(...args: string[]): Promise<string> {
  const [stdout, stderr] = await exec("git", args);
  if (stderr) {
    throw new ValidationError(
      `Git command failed:\ngit ${args.join(" ")}\n\n${stdout}`
    );
  }
  return stdout;
}
