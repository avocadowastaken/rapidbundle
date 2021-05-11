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
    return String(value)
      .trim()
      .replace(/(\[\d\d:\d\d:\d\d])/g, "[HH:mm:ss]");
  },
});

for (const example of fs.readdirSync(EXAMPLES_DIR)) {
  const exampleDir = path.join(EXAMPLES_DIR, example);
  if (!fs.statSync(exampleDir).isDirectory()) continue;

  test(example, async () => {
    const { stderr, stdout } = await execa.node(BIN_PATH, {
      reject: false,
      cwd: exampleDir,
    });

    await execa.node(exampleDir);

    snapshots.add(stdout);

    expect(stderr).toBe("");
    expect(stdout).toMatchSnapshot(example);

    const { stdout: gitStatus } = await execa("git", [
      "status",
      "--porcelain",
      path.join(exampleDir, "dist"),
    ]);

    expect(gitStatus).toBe("");
  });
}
