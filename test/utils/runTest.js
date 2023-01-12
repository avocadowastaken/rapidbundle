import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "../../src/utils/exec.js";
import { gitStatus } from "../../src/utils/git.js";
import { execCLI } from "./execCLI.js";
import { registerRawSnapshot } from "./registerRawSnapshot.js";

/**
 * @typedef {object} IntegrationTestOptions
 * @property {NodeJS.ProcessEnv} [env]
 */

/** @param {IntegrationTestOptions} [options] */
export function runIntegrationTest(options = {}) {
  const { env } = options;
  const { testPath = "" } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const [output, exitCode] = await execCLI(fixtureDir, [], env);

    expect(output).toMatchSnapshot("logs");
    expect(exitCode).toBe(0);

    const distFiles = await fs.readdir(distDir);

    expect(distFiles).toMatchSnapshot("dist");
    expect(process.exitCode).toBeUndefined();

    for (const distFile of distFiles) {
      const distFilePath = path.join(distDir, distFile);
      const distFileContent = await fs.readFile(distFilePath, "utf8");
      registerRawSnapshot(distFileContent);
      expect(distFileContent).toMatchSnapshot(`dist/${distFile}`);
    }
  });
}

/**
 * @typedef {object} ErrorTestOptions
 * @property {NodeJS.ProcessEnv} [env]
 */

/** @param {ErrorTestOptions} [options] */
export function runErrorTest(options = {}) {
  const { env } = options;
  const { testPath = "" } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const [output, exitCode] = await execCLI(fixtureDir, [], env);

    expect(output).toMatchSnapshot("output");
    expect(exitCode).toBe(1);

    const status = await gitStatus(distDir);

    if (status) {
      await exec("git", ["checkout", "HEAD", "--", distDir]);
    }
  });
}
