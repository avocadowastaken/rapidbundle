"use strict";

const fs = require("fs");
const path = require("path");

const execCLI = require("./utils/execCLI");

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");
const ERROR_FIXTURES_DIR = path.join(FIXTURES_DIR, "errors");

for (const fixture of fs.readdirSync(ERROR_FIXTURES_DIR)) {
  const fixtureDir = path.join(ERROR_FIXTURES_DIR, fixture);
  if (!fs.statSync(fixtureDir).isDirectory()) continue;

  test(fixture, async () => {
    const [stdout, stderr, exitCode] = await execCLI(fixtureDir);

    expect(stderr).toBe("");
    expect(stdout).toMatchSnapshot();
    expect(exitCode).toBe(1);

    const distDir = path.join(fixtureDir, "dist");
    expect(fs.existsSync(distDir)).toBe(false);
  });
}
