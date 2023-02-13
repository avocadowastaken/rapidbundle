import path from "node:path";
import { fileURLToPath } from "node:url";
import stripAnsi from "strip-ansi";
import { exec, execNode } from "../../src/utils/exec.js";
import { registerRawSnapshot } from "./registerRawSnapshot.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(DIR, "..", "..");

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
 *
 * @param {import('../../src/utils/exec.js').ExecOptions} options
 * @returns {Promise<[string, number]>}
 */
function execBin(options) {
  if (process.env["TEST_BUNDLE"] === "true") {
    return exec("npx", [ROOT_DIR], options);
  }

  const binPath = path.join(ROOT_DIR, "src", "cli.js");
  return execNode(binPath, [], options);
}

/**
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<string>}
 */
export async function execCLI(cwd, env = { CI: "false" }) {
  const [rawStdout, exitCode] = await execBin({
    cwd,
    env: { ...env, BROWSERSLIST_IGNORE_OLD_DATA: "true" },
  });

  const cleanStdout = cleanupLogs(rawStdout);
  const output = `${cleanStdout}\n------\nExit Code: ${exitCode}`;
  registerRawSnapshot(output);
  return output;
}
