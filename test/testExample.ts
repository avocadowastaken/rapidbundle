import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { expect } from "vitest";
import { testBundle, TestBundleOptions } from "./testBundle";
import { execCLI } from "./utils/execCLI";
import { registerRawSnapshot } from "./utils/registerRawSnapshot";

export function testExample(fileUrl: string, options: TestBundleOptions = {}) {
  const testPath = fileURLToPath(fileUrl);
  const fixtureDir = path.dirname(testPath);
  const distDir = path.join(fixtureDir, "dist");

  testBundle(fileUrl, options, async () => {
    const output = await execCLI();

    expect(output).toMatchSnapshot("logs");
    expect(process.exitCode).toBeUndefined();

    const distFiles = await fs.readdir(distDir);
    expect(distFiles).toMatchSnapshot("dist");

    for (const distFile of distFiles) {
      const distFilePath = path.join(distDir, distFile);
      const distFileContent = await fs.readFile(distFilePath, "utf8");
      registerRawSnapshot(distFileContent);
      expect(distFileContent).toMatchSnapshot(`dist/${distFile}`);
    }
  });
}
