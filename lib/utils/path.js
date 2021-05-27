import path from "path";

/**
 * @param {string} rootDir
 * @param {string} outputFile
 */
export function resolveEntry(rootDir, outputFile) {
  const srcDir = path.join(rootDir, "src");
  const distDir = path.join(rootDir, "dist");
  const outputDir = path.dirname(outputFile);

  const entryDir = path.relative(distDir, outputDir);
  const entryBaseName = path.basename(outputFile, path.extname(outputFile));

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
