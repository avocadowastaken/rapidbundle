import path from "node:path";
import { isFile } from "./fs.js";

const SRC_DIR = "src";
const DIST_DIR = "dist";

/**
 * @param {string} rootDir
 * @returns {string}
 */
export function getDistDir(rootDir) {
  return path.join(rootDir, DIST_DIR);
}

/**
 * @param {string} outputFileExtension
 * @return {string[]}
 */
function getEntryExtensions(outputFileExtension) {
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

/**
 * @param {string} entry
 * @param {string[]} extensions
 */
async function resolveFile(entry, extensions) {
  for (const extension of extensions) {
    const entryPath = entry + extension;

    if (await isFile(entryPath)) {
      return entryPath;
    }
  }

  return entry;
}

/**
 * @param {string} baseDir
 * @param {string} outputFile
 * @return {Promise<string>}
 */
export async function resolveEntry(baseDir, outputFile) {
  const outputFileExt = path.extname(outputFile);
  const entryExtensions = getEntryExtensions(outputFileExt);
  const entryName = path.basename(outputFile, outputFileExt);
  const entryDir = path.dirname(outputFile.replace(DIST_DIR, SRC_DIR));
  const entry = path.join(baseDir, entryDir, entryName);
  return resolveFile(entry, entryExtensions);
}

/**
 * @param {string} rootDir
 * @param {string} input
 * @returns {string}
 */
export function formatRelativePath(rootDir, input) {
  return `./${path.relative(rootDir, input).replace(/\\/g, "/")}`;
}
