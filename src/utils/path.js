import { createRequire } from "node:module";
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

/**
 * @param {string} cwd
 * @param {string} id
 * @param {string} [bin]
 * @returns {string}
 */
export function resolvePackageBin(cwd, id, bin = id) {
  const require = createRequire(path.join(cwd, "package.json"));
  const packageJSONPath = require.resolve(`${id}/package.json`);
  /** @type {{ bin?: string | Record<string, string> }} */
  const packageJSON = require(packageJSONPath);

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
