"use strict";

module.exports = class CLIError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "CLIError";
  }
};
