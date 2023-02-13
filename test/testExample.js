import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { expect, test } from "vitest";
import { execCLI } from "./utils/execCLI.js";
import { registerRawSnapshot } from "./utils/registerRawSnapshot.js";

/**
 * @typedef {object} IntegrationTestOptions
 * @property {NodeJS.ProcessEnv} [env]
 */

/**
 *  @param {string} fileUrl
 * @param {IntegrationTestOptions} [options]
 * */
export function testExample(fileUrl, options = {}) {
  const { env } = options;
  const testPath = fileURLToPath(fileUrl);
  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const output = await execCLI(fixtureDir, env);

    expect(output).toMatchSnapshot("logs");

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
