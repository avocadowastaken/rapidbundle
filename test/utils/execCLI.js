"use strict";

const path = require("path");
const execa = require("execa");
const stripANSI = require("strip-ansi");

const registerRawSnapshot = require("./registerRawSnapshot");

const ROOT_DIR = path.join(__dirname, "..", "..");
const BIN = path.join(ROOT_DIR, "bin");

/**
 * @param {string} input
 * @returns {string}
 */
function cleanupLogs(input) {
  return input
    .split("\n")
    .map((line) =>
      stripANSI(line)
        .replace(/ \([\d.]+(ms|s)\)$/, " (<elapsedTime>)")
        .replace(ROOT_DIR, "<rootDir>")
    )
    .join("\n");
}

/**
 * @param {string} cwd
 * @param {string[]} [args]
 * @returns {Promise<[stdout: string, stderr: string, exitCode: number]>}
 */
module.exports = async function execCLI(cwd, args = []) {
  const result = await execa.node(BIN, args, { cwd, reject: false });

  const stdout = cleanupLogs(result.stdout);
  const stderr = cleanupLogs(result.stderr);

  registerRawSnapshot(stdout);
  registerRawSnapshot(stderr);

  return [stdout, stderr, result.exitCode];
};
