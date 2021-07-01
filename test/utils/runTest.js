import { promises as fs } from "fs";
import path from "path";
import { execCLI } from "./execCLI";
import { registerRawSnapshot } from "./registerRawSnapshot";

export function runIntegrationTest() {
  const { testPath } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const [stdout, stderr, exitCode] = await execCLI(fixtureDir);

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

export function runErrorTest() {
  const { testPath } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  test(fixtureName, async () => {
    const [stdout, stderr, exitCode] = await execCLI(fixtureDir);

    expect(stdout).toMatchSnapshot("stdout");
    expect(stderr).toMatchSnapshot("stderr");
    expect(exitCode).toBe(1);

    await expect(fs.stat(distDir)).rejects.toBeDefined();
  });
}
