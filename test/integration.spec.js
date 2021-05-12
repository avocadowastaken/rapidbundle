"use strict";

const fs = require("fs");
const path = require("path");
const util = require("util");
const stripANSI = require("strip-ansi");

const CWD = process.cwd();
const BIN_PATH = path.join(CWD, "bin");
const FIXTURES_DIR = path.join(CWD, "test", "__fixtures__");

/** @type {Set<string>} */
const snapshots = new Set();

expect.addSnapshotSerializer({
  test(value) {
    return typeof value == "string" && snapshots.has(value);
  },
  print(value) {
    return String(value);
  },
});

/** @type {jest.SpyInstance} */
let log;

function extractLogs() {
  const message = log.mock.calls
    .map((args) => {
      let line = stripANSI(util.format(...args)).replace(
        /^(\[\d\d:\d\d:\d\d])/,
        "[HH:mm:ss]"
      );

      if (line.includes(CWD)) {
        line = line.replace(CWD, "<cwd>").replace(/\\/g, "/");
      }

      return line;
    })
    .join("\n");

  snapshots.add(message);

  return message;
}

beforeAll(() => {
  process.stdout.isTTY = false;
});

beforeEach(() => {
  process.exitCode = undefined;
  log = jest.spyOn(console, "log").mockImplementation();
});

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("errors", () => {
  const errorFixturesDir = path.join(FIXTURES_DIR, "errors");

  for (const fixture of fs.readdirSync(errorFixturesDir)) {
    const fixtureDir = path.join(errorFixturesDir, fixture);
    if (!fs.statSync(fixtureDir).isDirectory()) continue;

    test(fixture, async () => {
      jest.spyOn(process, "cwd").mockImplementation(() => fixtureDir);
      await require(BIN_PATH);
      expect(extractLogs()).toMatchSnapshot();
      expect(process.exitCode).toBe(1);

      const distDir = path.join(fixtureDir, "dist");
      expect(fs.existsSync(distDir)).toBe(false);
    });
  }
});

describe("examples", () => {
  const examplesDir = path.join(CWD, "examples");

  for (const example of fs.readdirSync(examplesDir)) {
    const exampleDir = path.join(examplesDir, example);
    if (!fs.statSync(exampleDir).isDirectory()) continue;

    test(example, async () => {
      jest.spyOn(process, "cwd").mockImplementation(() => exampleDir);

      await require(BIN_PATH);

      expect(extractLogs()).toMatchSnapshot("logs");

      const distDir = path.join(exampleDir, "dist");
      const distFiles = fs.readdirSync(distDir);

      expect(distFiles).toMatchSnapshot("dist files");

      for (const distFile of distFiles) {
        const distFilePath = path.join(distDir, distFile);
        const distFileContent = fs.readFileSync(distFilePath, "utf8");

        snapshots.add(distFileContent);
        expect(distFileContent).toMatchSnapshot(distFile);
      }
    });
  }
});
