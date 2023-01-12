import { spawn } from "node:child_process";

/**
 * @typedef {object} ExecOptions
 * @property {string} [cwd]
 * @property {NodeJS.ProcessEnv} [options.env]
 * @property {"pipe" | "inherit"} [options.stderr]
 */

/**
 * @param {string} command
 * @param {string[]} [args]
 * @param {ExecOptions} [options]
 * @returns {Promise<[output: string, exitCode: number]>}
 */
export async function exec(command, args = [], options = {}) {
  const { env, cwd, stderr = "pipe" } = options;
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: [null, "pipe", stderr],
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

  /** @type {number} */
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", (error) => {
      reject(error);
    });
    child.once("close", (code) => {
      resolve(code || 0);
    });
  });

  return [output.trim(), exitCode];
}

/**
 * @param {string} modulePath
 * @param {string[]} [args]
 * @param {ExecOptions} [options]
 * @returns {Promise<[output: string, exitCode: number]>}
 */
export function execNode(modulePath, args = [], options) {
  return exec(process.execPath, [modulePath, ...args], options);
}
