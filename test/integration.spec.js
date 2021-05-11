"use strict";

const fs = require("fs");
const path = require("path");
const execa = require("execa");

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

function extractLogs() {
  const message = log.mock.calls
    .map(([line]) => line.replace(/^(\[\d\d:\d\d:\d\d])/, "[HH:mm:ss]"))
    .join("\n");

  snapshots.add(message);

  return message;
}

beforeEach(() => {
  process.stdout.isTTY = false;
  log = jest.spyOn(console, "log").mockImplementation();
});

afterAll(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

for (const example of fs.readdirSync(EXAMPLES_DIR)) {
  const exampleDir = path.join(EXAMPLES_DIR, example);
  if (!fs.statSync(exampleDir).isDirectory()) continue;

  test(example, async () => {
    jest.spyOn(process, "cwd").mockImplementation(() => exampleDir);

    await require(BIN_PATH);

    expect(extractLogs()).toMatchSnapshot();

    await expect(
      execa("git", ["status", "--porcelain", path.join(exampleDir, "dist")])
    ).resolves.toMatchObject({ stdout: "" });
  });
}
