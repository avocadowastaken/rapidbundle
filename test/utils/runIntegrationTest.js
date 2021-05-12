"use strict";

const path = require("path");
const { promises: fs } = require("fs");
const spyLog = require("./spyLog");
const registerRawSnapshot = require("./registerRawSnapshot");

module.exports = function runIntegrationTest() {
  const { testPath } = expect.getState();

  const fixtureDir = path.dirname(testPath);
  const fixtureName = path.basename(fixtureDir);
  const distDir = path.join(fixtureDir, "dist");

  jest.setTimeout(30 * 1000);

  beforeEach(() => {
    delete process.exitCode;
    process.stdout.isTTY = false;
  });

  test(fixtureName, async () => {
    const extractLogs = spyLog();

    jest.spyOn(process, "cwd").mockImplementation(() => fixtureDir);

    // @ts-ignore
    await require("../../bin");

    expect(extractLogs()).toMatchSnapshot("logs");

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
};
