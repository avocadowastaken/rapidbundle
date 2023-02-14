import path from "node:path";
import { fileURLToPath } from "node:url";
import stripAnsi from "strip-ansi";
import TaskTree from "tasktree-cli";
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
        .replace(/\b(chrome|edge|firefox|ios|safari)[\d.]+\b/gm, "$1<version>")
    )
    .join("\n")
    .trim();
}

async function runSrc(): Promise<string> {
  process.argv.push("--silent");
  vi.spyOn(process, "exit").mockRejectedValue(new Error("exit"));

  const tree = TaskTree.tree();

  if (process.env["TEST_BUNDLE"] !== "true") {
    await import("../../src/cli");
  } else {
    await import(path.join(ROOT_DIR, "dist", "cli.js"));
  }

  return tree.render().join("\n");
}

export async function execCLI(): Promise<string> {
  const rawStdout = await runSrc();
  const cleanStdout = cleanupLogs(rawStdout);
  const output = `${cleanStdout}\n------\nExit Code: ${process.exitCode ?? 0}`;
  registerRawSnapshot(output);
  return output;
}
