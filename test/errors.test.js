"use strict";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execCLI } from "./utils/execCLI.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(DIR, "__fixtures__");
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
