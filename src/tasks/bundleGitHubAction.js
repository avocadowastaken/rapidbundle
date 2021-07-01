import esbuild from "esbuild";
import execa from "execa";
import {
  formatRelativePath,
  resolveDistDir,
  resolveEntry,
} from "../utils/path.js";

/**
 * @typedef {object} GitHubActionBundleOptions
 * @property {string} entryPoint
 * @property {string} outputFile
 * @property {string} targetVersion
 */

/**
 * @param {string} cwd
 * @param {import("../manifests/ActionYML.js").ActionYML} actionYML
 * @returns {AsyncGenerator<string, void>}
 */
export async function* bundleGitHubAction(cwd, actionYML) {
  const distDir = resolveDistDir(cwd);

  /** @type {esbuild.BuildOptions}*/
  const options = {
    logLevel: "silent",

    bundle: true,
    outdir: distDir,
    keepNames: true,
    platform: "node",

    external: [
      // Optional dependency of the `node-fetch`.
      "encoding",
    ],
  };

  {
    const mainEntry = resolveEntry(cwd, actionYML.runs.main);
    options.entryPoints = [mainEntry];
    yield "Using '.runs.main' entry: " + formatRelativePath(cwd, mainEntry);

    if (actionYML.runs.pre) {
      const preEntry = resolveEntry(cwd, actionYML.runs.pre);
      yield "Using '.runs.pre' entry: " + formatRelativePath(cwd, preEntry);
      options.entryPoints.push(preEntry);
    }

    if (actionYML.runs.post) {
      const postEntry = resolveEntry(cwd, actionYML.runs.post);
      yield "Using '.runs.post' entry: " + formatRelativePath(cwd, postEntry);
      options.entryPoints.push(postEntry);
    }
  }

  {
    options.target = actionYML.runs.using;
    yield `Using '.runs.using' entry: ${options.target}`;
  }

  await esbuild.build(options);

  if (process.env.CI === "true") {
    yield "Checking build difference";

    const { stdout: status } = await execa(
      "git",
      ["status", "--porcelain", distDir],
      { stderr: "inherit" }
    );

    if (status) {
      const { stdout: diff } = await execa(
        "git",
        ["diff", "--minimal", "--unified=0", distDir],
        { stderr: "inherit" }
      );

      throw new Error(`Found build difference:\n${diff || status}`);
    }
  }
}
