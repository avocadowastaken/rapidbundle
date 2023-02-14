import { spawn } from "node:child_process";

export type ExecOptions = {
  cwd?: string;
  env?: Record<string, string>;
};

export type ExecResult = [output: string, exitCode: number];

export async function exec(
  command: string,
  args: string[] = [],
  { env, cwd }: ExecOptions = {}
): Promise<ExecResult> {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: [null, "pipe", "pipe"],
  });

  let output = "";

  if (child.stdout) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
  }

  if (child.stderr) {
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
  }

  const exitCode: number = await new Promise((resolve, reject) => {
    child.once("error", (error) => {
      reject(error);
    });
    child.once("close", (code) => {
      resolve(code || 0);
    });
  });

  return [output.trim(), exitCode];
}

export function execNode(
  modulePath: string,
  args: string[] = [],
  options?: ExecOptions
): Promise<ExecResult> {
  return exec(process.execPath, [modulePath, ...args], options);
}
