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
 * @param {string} [outputFileExt]
 */
export function resolveEntry(
  rootDir,
  outputFile,
  outputFileExt = path.extname(outputFile)
) {
  const srcDir = resolveSrcDir(rootDir);
  const distDir = resolveDistDir(rootDir);
  const outputDir = path.dirname(path.join(rootDir, outputFile));

  const entryDir = path.relative(distDir, outputDir);
  const entryBaseName = path.basename(outputFile, outputFileExt);

  return path.join(srcDir, entryDir, entryBaseName);
}

/**
 * @param {string} rootDir
 * @param {string} input
 * @returns {string}
 */
export function formatRelativePath(rootDir, input) {
  return `./${path.relative(rootDir, input).replace(/\\/g, "/")}`;
}