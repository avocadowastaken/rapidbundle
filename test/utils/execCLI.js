import execa from "execa";
import path from "path";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";
import { registerRawSnapshot } from "./registerRawSnapshot";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(DIR, "..", "..");
const BIN = path.join(ROOT_DIR, "lib", "cli.js");

/**
 * @param {string} input
 * @returns {string}
 */
function cleanupLogs(input) {
  return input
    .split("\n")
    .map((line) =>
      stripAnsi(line)
        .replace(ROOT_DIR, "<rootDir>")
        .replace(/\[\d\d:\d\d:\d\d]/g, "[HH:MM:SS]")
        .replace(/ \([\d.]+(ms|s)\)$/, " (<elapsedTime>)")
    )
    .join("\n");
}

/**
 * @param {string} cwd
 * @param {string[]} [args]
 * @returns {Promise<[stdout: string, stderr: string, exitCode: number]>}
 */
export async function execCLI(cwd, args = []) {
  const result = await execa.node(BIN, args, { cwd, reject: false });

  const stdout = cleanupLogs(result.stdout);
  const stderr = cleanupLogs(result.stderr);

  registerRawSnapshot(stdout);
  registerRawSnapshot(stderr);

  return [stdout, stderr, result.exitCode];
}
