import esbuild from "esbuild";
import { gitDiff, gitStatus } from "../utils/git.js";
import { formatRelativePath, getDistDir, resolveEntry } from "../utils/path.js";

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
  const distDir = getDistDir(cwd);

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

    treeShaking: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  };

  {
    const mainEntry = await resolveEntry(cwd, actionYML.runs.main);
    options.entryPoints = [mainEntry];
    yield "Using '.runs.main' entry: " + formatRelativePath(cwd, mainEntry);

    if (actionYML.runs.pre) {
      const preEntry = await resolveEntry(cwd, actionYML.runs.pre);
      yield "Using '.runs.pre' entry: " + formatRelativePath(cwd, preEntry);
      options.entryPoints.push(preEntry);
    }

    if (actionYML.runs.post) {
      const postEntry = await resolveEntry(cwd, actionYML.runs.post);
      yield "Using '.runs.post' entry: " + formatRelativePath(cwd, postEntry);
      options.entryPoints.push(postEntry);
    }
  }

  {
    options.target = actionYML.runs.using;
    yield `Using '.runs.using' entry: ${options.target}`;
  }

  await esbuild.build(options);

  if (process.env["CI"] === "true") {
    yield "Checking build difference";

    const status = await gitStatus(distDir);

    if (status) {
      const diff = await gitDiff(distDir);
      throw new Error(`Found build difference:\n${diff || status}`);
    }
  }
}
