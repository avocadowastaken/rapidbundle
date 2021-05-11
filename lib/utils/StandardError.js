"use strict";

module.exports = class StandardError extends Error {
  /** @param {string | undefined} message */
  constructor(message) {
    super(message);
    this.name = "StandardError";
  }
};
