import path from "node:path";
import { fileURLToPath } from "node:url";
import stripAnsi from "strip-ansi";
import { vi } from "vitest";
import { execNode, ExecResult } from "../../src/utils/exec";
import { getDistDir } from "../../src/utils/path";
import { registerRawSnapshot } from "./registerRawSnapshot";

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

function spyLogs(): string[] {
  const logs: string[] = [];
  const onLog = (...args: unknown[]) => {
    logs.push(args.join(" "));
  };

  vi.spyOn(console, "log").mockImplementation(onLog);
  vi.spyOn(console, "info").mockImplementation(onLog);
  vi.spyOn(console, "warn").mockImplementation(onLog);
  vi.spyOn(console, "error").mockImplementation(onLog);

  return logs;
}

async function execBin(
  cwd: string,
  env: NodeJS.ProcessEnv
): Promise<ExecResult> {
  if (process.env["TEST_BUNDLE"] === "true") {
    const binPath = path.join(getDistDir(ROOT_DIR), "cli.js");
    return execNode(binPath, [], { cwd, env });
  }

  for (const [key, value] of Object.entries(env)) {
    if (value) {
      vi.stubEnv(key, value);
    }
  }

  const { run } = await import("../../src");
  const logs = spyLogs();
  let exitCode = 0;
  try {
    await run({ cwd, isCI: env["CI"] === "true" });
  } catch (e) {
    exitCode = 1;
  }

  return [logs.join("\n"), exitCode];
}

export async function execCLI(cwd: string, isCI = false): Promise<string> {
  const [rawStdout, exitCode] = await execBin(cwd, {
    CI: String(isCI),
    BROWSERSLIST_IGNORE_OLD_DATA: "true",
  });

  const cleanStdout = cleanupLogs(rawStdout);
  const output = `${cleanStdout}\n------\nExit Code: ${exitCode}`;
  registerRawSnapshot(output);
  return output;
}
