import path from "node:path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, expect, test } from "vitest";
import { gitCommand, gitStatus } from "../src/utils/git";
import { getDistDir } from "../src/utils/path";
import { execCLI } from "./utils/execCLI";

export function testError(fileUrl: string, isCI?: boolean) {
  const testPath = fileURLToPath(fileUrl);
  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const cleanDist = async () => {
    const distDir = getDistDir(fixtureDir);
    const status = await gitStatus(distDir);
    if (status) {
      await gitCommand("checkout", "HEAD", "--", distDir);
    }
  };

  afterEach(cleanDist);
  beforeEach(cleanDist);

  test(fixtureName, async () => {
    const output = await execCLI(fixtureDir, isCI);

    expect(output).toMatchSnapshot("output");
  });
}
