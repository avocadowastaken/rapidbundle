import path from "path";

/**
 * @param {string} rootDir
 * @returns {string}
 */
export function resolveSrcDir(rootDir) {
  return path.join(rootDir, "src");
}

/**
 * @param {string} rootDir
 * @returns {string}
 */
export function resolveDistDir(rootDir) {
  return path.join(rootDir, "dist");
}

/**
 * @param {string} rootDir
 * @param {string} outputFile
 */
export function resolveEntry(rootDir, outputFile) {
  const srcDir = resolveSrcDir(rootDir);
  const distDir = resolveDistDir(rootDir);
  const outputDir = path.dirname(outputFile);

  const entryDir = path.relative(distDir, outputDir);
  const entryBaseName = path.basename(outputFile, path.extname(outputFile));

  return path.join(srcDir, entryDir, entryBaseName);
}
