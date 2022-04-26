import path from "node:path";
import { fileURLToPath } from "node:url";
import stripAnsi from "strip-ansi";
import { execNode } from "../../src/utils/exec.js";
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
 * @returns {Promise<[stdout: string, exitCode: number]>}
 */
export async function execCLI(cwd, args = [], env = { CI: "false" }) {
  const [rawStdout, exitCode] = await execNode(BIN, args, {
    env,
    cwd,
  });

  const output = cleanupLogs(rawStdout);

  registerRawSnapshot(output);

  return [output, exitCode];
}
