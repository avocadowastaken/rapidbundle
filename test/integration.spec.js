"use strict";

const fs = require("fs");
const path = require("path");
const util = require("util");

const CWD = process.cwd();
const BIN_PATH = path.join(CWD, "bin");
const EXAMPLES_DIR = path.join(CWD, "examples");

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
/** @type {jest.SpyInstance} */
let logError;

function extractLogs() {
  const message = log.mock.calls
    .map((args) => {
      let line = util
        .format(...args)
        .replace(/^(\[\d\d:\d\d:\d\d])/, "[HH:mm:ss]");

      if (line.includes(CWD)) {
        line = line.replace(CWD, "<cwd>").replace(/\\/g, "/");
      }

      return line;
    })
    .join("\n");

  snapshots.add(message);

  return message;
}

beforeEach(() => {
  process.stdout.isTTY = false;
  log = jest.spyOn(console, "log").mockImplementation();
  logError = jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("errors", () => {
  /** @param {string} name */
  async function runErrorFixture(name) {
    const errorFixturePath = path.join(__dirname, "__fixtures__", name);

    jest.spyOn(process, "cwd").mockImplementation(() => errorFixturePath);

    await require(BIN_PATH);

    expect(process.exitCode).toBe(1);
    expect(logError).toBeCalledTimes(1);

    return errorFixturePath;
  }

  test("Error", async () => {
    await runErrorFixture("invalid-package-engine-version");

    expect(extractLogs()).toMatchSnapshot();
    expect(logError).lastCalledWith(new TypeError("Invalid comparator: !@#"));
  });

  test("StandardError", async () => {
    const errorFixturePath = await runErrorFixture("empty-package-json");

    expect(extractLogs()).toMatchSnapshot();
    expect(logError).lastCalledWith(
      `Failed to parse ${path.join(errorFixturePath, "package.json")}`
    );
  });
});

for (const example of fs.readdirSync(EXAMPLES_DIR)) {
  const exampleDir = path.join(EXAMPLES_DIR, example);
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
