import path from "node:path";
import { fileURLToPath } from "node:url";
import stripAnsi from "strip-ansi";
import { exec, execNode } from "../../src/utils/exec.js";
import { getDistDir } from "../../src/utils/path";
import { registerRawSnapshot } from "./registerRawSnapshot.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(DIR, "..", "..");

function cleanupLogs(input: string): string {
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

function execBin(options: { cwd: string; env: NodeJS.ProcessEnv }) {
  if (process.env["TEST_BUNDLE"] === "true") {
    const binPath = path.join(getDistDir(ROOT_DIR), "cli.js");
    return execNode(binPath, [], options);
  }

  const binPath = path.join(ROOT_DIR, "src", "cli.ts");
  return exec("npx", ["tsx", binPath], options);
}

export async function execCLI(cwd: string, isCI = false): Promise<string> {
  const [rawStdout, exitCode] = await execBin({
    cwd,
    env: {
      CI: String(isCI),
      BROWSERSLIST_IGNORE_OLD_DATA: "true",
    },
  });

  const cleanStdout = cleanupLogs(rawStdout);
  const output = `${cleanStdout}\n------\nExit Code: ${exitCode}`;
  registerRawSnapshot(output);
  return output;
}
