import path from "node:path";
import { isFile } from "./fs";

const SRC_DIR = "src";
const DIST_DIR = "dist";

const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js"] as const;
const CJS_ONLY_EXTENSIONS = [".cts", ".cjs"] as const;
const MJS_ONLY_EXTENSIONS = [".mts", ".mjs"] as const;
const CJS_EXTENSIONS = [...CJS_ONLY_EXTENSIONS, ...DEFAULT_EXTENSIONS] as const;
const MJS_EXTENSIONS = [...MJS_ONLY_EXTENSIONS, ...DEFAULT_EXTENSIONS] as const;
const DTS_EXTENSIONS = [
  ...MJS_ONLY_EXTENSIONS,
  ...CJS_ONLY_EXTENSIONS,
  ...DEFAULT_EXTENSIONS,
] as const;

export function getDistDir(rootDir: string): string {
  return path.join(rootDir, DIST_DIR);
}

function getEntryExtensions(outputFileExtension: string): readonly string[] {
  switch (outputFileExtension) {
    case ".cjs":
      return CJS_EXTENSIONS;
    case ".mjs":
      return MJS_EXTENSIONS;
    case ".d.ts":
      return DTS_EXTENSIONS;
    default:
      return DEFAULT_EXTENSIONS;
  }
}

async function resolveFile(
  entry: string,
  extensions: readonly string[]
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
  const entryName = path.basename(outputFile, outputFileExt);
  const entryDir = path.dirname(outputFile.replace(DIST_DIR, SRC_DIR));
  const entry = path.join(baseDir, entryDir, entryName);
  const entryExtensions = getEntryExtensions(outputFileExt);
  const filePath = await resolveFile(entry, entryExtensions);
  return path.relative(baseDir, filePath);
}

export function toModuleID(input: string): string {
  return input.replace(/\\/g, "/");
}
