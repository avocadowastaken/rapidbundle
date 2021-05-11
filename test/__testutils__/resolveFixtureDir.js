"use strict";

const _ = require("lodash");
const path = require("path");

module.exports = function resolveFixtureDir() {
  const { testPath, currentTestName } = expect.getState();
  const testName = _.snakeCase(path.basename(testPath));
  const baseDir = path.join(
    process.cwd(),
    "node_modules",
    ".fixtures",
    testName
  );

  if (!currentTestName) {
    return baseDir;
  }

  return path.join(baseDir, _.snakeCase(currentTestName));
};
