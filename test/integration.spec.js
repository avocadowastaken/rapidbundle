"use strict";

const fs = require("fs");
const path = require("path");

const spyLog = require("./utils/spyLog");

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");
const ERROR_FIXTURES_DIR = path.join(FIXTURES_DIR, "errors");

jest.setTimeout(30 * 1000);

beforeEach(() => {
  delete process.exitCode;
  process.stdout.isTTY = false;
});

for (const fixture of fs.readdirSync(ERROR_FIXTURES_DIR)) {
  const fixtureDir = path.join(ERROR_FIXTURES_DIR, fixture);
  if (!fs.statSync(fixtureDir).isDirectory()) continue;

  test(fixture, async () => {
    const extractLogs = spyLog();
    jest.spyOn(process, "cwd").mockImplementation(() => fixtureDir);
    // @ts-ignore
    await require("../bin");
    expect(extractLogs()).toMatchSnapshot();
    expect(process.exitCode).toBe(1);

    const distDir = path.join(fixtureDir, "dist");
    expect(fs.existsSync(distDir)).toBe(false);
  });
}
