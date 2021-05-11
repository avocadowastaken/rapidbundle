"use strict";

const debug = require("debug");

/**
 * @param {...string} namespace
 * @returns {import("debug").Debugger}
 */
module.exports = function createLogger(...namespace) {
  const logger = debug(["rapidbundle", ...namespace].join(":"));
  logger.log = console.log.bind(console);
  return logger;
};
