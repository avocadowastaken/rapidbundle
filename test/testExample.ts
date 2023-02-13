import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { expect, test } from "vitest";
import { execCLI } from "./utils/execCLI.js";
import { registerRawSnapshot } from "./utils/registerRawSnapshot.js";

export function testExample(fileUrl: string, isCI?: boolean) {
  const testPath = fileURLToPath(fileUrl);
  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const output = await execCLI(fixtureDir, isCI);

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
