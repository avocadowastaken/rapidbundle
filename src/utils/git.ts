import { exec } from "./exec";
import { ValidationError } from "./validation";

export async function git(...args: string[]): Promise<string> {
  const [stdout, exitCode] = await exec("git", args, {
    shouldRetry: ([, errorCode]) => {
      // Git lockfile exists error, retry in second.
      return errorCode === 128;
    },
  });
  if (exitCode > 0) {
    throw new ValidationError(
      `Git command failed:\ngit ${args.join(" ")}\n\n${stdout}\n\n${exitCode}`
    );
  }
  return stdout;
}
