import path from "node:path";
import { fileURLToPath } from "url";
import { afterEach, expect, test } from "vitest";
import { exec } from "../src/utils/exec.js";
import { gitStatus } from "../src/utils/git.js";
import { getDistDir } from "../src/utils/path.js";
import { execCLI } from "./utils/execCLI.js";

/**
 * @typedef {object} ErrorTestOptions
 * @property {NodeJS.ProcessEnv} [env]
 */

/**
 * @param {string} fileUrl
 * @param {ErrorTestOptions} [options]
 * */
export function testError(fileUrl, options = {}) {
  const { env } = options;
  const testPath = fileURLToPath(fileUrl);
  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);

  test(fixtureName, async () => {
    const output = await execCLI(fixtureDir, [], env);

    expect(output).toMatchSnapshot("output");
  });

  afterEach(async () => {
    const distDir = getDistDir(fixtureDir);
    const status = await gitStatus(distDir);

    if (status) {
      await exec("git", ["checkout", "HEAD", "--", distDir]);
    }
  });
}
