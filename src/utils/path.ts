import { createRequire } from "node:module";
import path from "node:path";
import { isFile } from "./fs";

const SRC_DIR = "src";
const DIST_DIR = "dist";

export function getDistDir(rootDir: string): string {
  return path.join(rootDir, DIST_DIR);
}

function getEntryExtensions(outputFileExtension: string): string[] {
  switch (outputFileExtension) {
    case ".cjs":
      return [".cts", ".cjs", ".ts", ".tsx", ".js"];
    case ".mjs":
      return [".mts", ".mjs", ".ts", ".tsx", ".js"];
    case ".d.ts":
      return [".mts", ".mjs", ".cts", ".cjs", ".ts", ".tsx", ".js"];

    default:
      return [".ts", ".tsx", ".js"];
  }
}

async function resolveFile(
  entry: string,
  extensions: string[]
): Promise<string> {
  for (const extension of extensions) {
    const entryPath = entry + extension;

    if (await isFile(entryPath)) {
      return entryPath;
    }
  }

  return entry;
}

export async function resolveEntry(
  baseDir: string,
  outputFile: string
): Promise<string> {
  const outputFileExt = path.extname(outputFile);
  const entryExtensions = getEntryExtensions(outputFileExt);
  const entryName = path.basename(outputFile, outputFileExt);
  const entryDir = path.dirname(outputFile.replace(DIST_DIR, SRC_DIR));
  const entry = path.join(baseDir, entryDir, entryName);
  return resolveFile(entry, entryExtensions);
}

export function formatRelativePath(rootDir: string, input: string): string {
  return `./${path.relative(rootDir, input).replace(/\\/g, "/")}`;
}

export function resolvePackageBin(
  cwd: string,
  id: string,
  bin: string = id
): string {
  const require = createRequire(path.join(cwd, "package.json"));
  const packageJSONPath = require.resolve(`${id}/package.json`);
  const packageJSON = require(packageJSONPath) as {
    bin?: string | Record<string, string>;
  };

  const binPath =
    typeof packageJSON.bin === "string"
      ? packageJSON.bin
      : packageJSON.bin?.[bin];

  if (!binPath) {
    throw new Error(`Failed to resolve: ${bin} from ${id}`);
  }

  const packageDir = path.dirname(packageJSONPath);

  return path.join(packageDir, binPath);
}
