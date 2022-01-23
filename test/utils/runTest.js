import { execa } from "execa";
import { promises as fs } from "fs";
import path from "path";
import { execCLI } from "./execCLI";
import { registerRawSnapshot } from "./registerRawSnapshot";

/**
 * @typedef {object} IntegrationTestOptions
 * @property {NodeJS.ProcessEnv} [env]
 */

/** @param {IntegrationTestOptions} [options] */
export function runIntegrationTest({ env } = {}) {
  const { testPath } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const [stdout, stderr, exitCode] = await execCLI(fixtureDir, [], env);

    expect(stderr).toBe("");
    expect(stdout).toMatchSnapshot("logs");
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
export function runErrorTest({ env } = {}) {
  const { testPath } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const [stdout, stderr, exitCode] = await execCLI(fixtureDir, [], env);

    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");
    expect(exitCode).toBe(1);

    const { stdout: status } = await execa("git", [
      "status",
      "--porcelain",
      distDir,
    ]);

    if (status) {
      await execa("git", ["checkout", "HEAD", "--", distDir]);
    }
  });
}
