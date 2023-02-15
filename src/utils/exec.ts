import type { ChildProcessWithoutNullStreams } from "child_process";
import { spawn } from "node:child_process";
import { PassThrough, Readable } from "node:stream";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type ExecResult = [output: string, exitCode: number];

export type ExecOptions = {
  cwd?: string;
  env?: Record<string, string>;
  shouldRetry?: (result: ExecResult) => boolean;
};

function processOutput(stdout: Readable, stderr: Readable): () => string {
  let output = "";
  const onData = (chunk: string) => {
    output += chunk;
  };

  const outputStream = new PassThrough();
  outputStream.on("data", onData);
  outputStream.setEncoding("utf-8");
  stdout.pipe(outputStream, { end: false });
  stderr.pipe(outputStream, { end: false });

  return () => {
    outputStream.end();
    return output.trim();
  };
}

function waitForClose(
  child: ChildProcessWithoutNullStreams
): Promise<null | number> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
}

export async function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { env, cwd, shouldRetry } = options;
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: [null, "pipe", "pipe"],
  });
  const collectOutput = processOutput(child.stdout, child.stderr);
  const exitCode = await waitForClose(child);
  const result: ExecResult = [collectOutput(), exitCode || 0];

  if (shouldRetry?.(result)) {
    await delay(1_000);
    return exec(command, args, options);
  }

  return result;
}
