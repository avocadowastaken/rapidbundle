import path from "node:path";
import { fileURLToPath } from "node:url";
import stripAnsi from "strip-ansi";
import { vi } from "vitest";
import { registerRawSnapshot } from "./registerRawSnapshot";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(DIR, "..", "..");

function cleanupLogs(input: string): string {
  return stripAnsi(input)
    .split("\n")
    .map((line) =>
      line
        .replace(ROOT_DIR, "<rootDir>")
        .replace(/ √ /g, " ✔ ")
        .replace(/ × /g, " ✘ ")
        .replace(/ i /g, " ℹ ")
        .replace(/\b(chrome|edge|firefox|ios|safari)[\d.]+\b/gm, "$1<version>")
    )
    .join("\n")
    .trim();
}

async function runSrc(): Promise<string> {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => void 0);
  if (process.env["TEST_BUNDLE"] !== "true") {
    await import("../../src/cli");
  } else {
    await import(path.join(ROOT_DIR, "dist", "cli.js"));
  }
  return logSpy.mock.lastCall?.[0] || "";
}

export async function execCLI(): Promise<string> {
  const rawStdout = await runSrc();
  const cleanStdout = cleanupLogs(rawStdout);
  const output = `${cleanStdout}\n------\nExit Code: ${process.exitCode ?? 0}`;
  registerRawSnapshot(output);
  return output;
}
