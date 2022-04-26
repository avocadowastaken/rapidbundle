import { execaNode } from "execa";
import path from "path";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";
import { registerRawSnapshot } from "./registerRawSnapshot.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(DIR, "..", "..");
const BIN =
  process.env["TEST_BUNDLE"] !== "true"
    ? path.join(ROOT_DIR, "src", "cli.js")
    : path.join(ROOT_DIR, "dist", "cli.js");

/**
 * @param {string} input
 * @returns {string}
 */
function cleanupLogs(input) {
  return stripAnsi(input)
    .split("\n")
    .map((line) =>
      line
        .replace(ROOT_DIR, "<rootDir>")
        .replace(/index \w{7}\.\.\w{7} \w{6}/, "index abcdef0..abcdef1 123456")
        .replace(/\b(chrome|edge|firefox|ios|safari)[\d.]+\b/gm, "$1<version>")
    )
    .join("\n");
}

/**
 * @param {string} cwd
 * @param {string[]} [args]
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<[stdout: string, stderr: string, exitCode: number]>}
 */
export async function execCLI(cwd, args = [], env = { CI: "false" }) {
  const result = await execaNode(BIN, args, { env, cwd, reject: false });

  const stdout = cleanupLogs(result.stdout);
  const stderr = cleanupLogs(result.stderr);

  registerRawSnapshot(stdout);
  registerRawSnapshot(stderr);

  return [stdout, stderr, result.exitCode];
}
