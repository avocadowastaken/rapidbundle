"use strict";

const path = require("path");
const util = require("util");
const stripANSI = require("strip-ansi");
const registerRawSnapshot = require("./registerRawSnapshot");

const ROOT_DIR = path.join(__dirname, "..", "..");

/** @returns {() => string} */
module.exports = function spyLog() {
  const log = jest.spyOn(console, "log").mockImplementation();

  return () => {
    const message = log.mock.calls
      .map((args) => {
        let line = stripANSI(util.format(...args)).replace(
          /^(\[\d\d:\d\d:\d\d])/,
          "[HH:mm:ss]"
        );

        if (line.includes(ROOT_DIR)) {
          line = line.replace(ROOT_DIR, "<rootDir>").replace(/\\/g, "/");
        }

        return line;
      })
      .join("\n");

    registerRawSnapshot(message);

    return message;
  };
};
