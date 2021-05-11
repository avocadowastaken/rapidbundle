"use strict";

const createLogger = require("../utils/createLogger");

/**
 * @typedef {object} BuildTaskOptions
 * @property {string} cwd
 */

module.exports = class BuildTask {
  /**
   * @param {string} name
   * @param {BuildTaskOptions} options
   */
  constructor(name, options) {
    /**
     * @type {BuildTaskOptions}
     * @readonly
     * @protected
     */
    this.options = options;

    /**
     * @type {import("debug").Debugger}
     * @readonly
     * @protected
     */
    this.logger = createLogger("build", "task", name);
  }

  /**
   * @returns {string}
   * @protected
   */
  get cwd() {
    return this.options.cwd;
  }

  /**
   * @param {string} format
   * @param {...unknown} args
   * @protected
   */
  log(format, ...args) {
    this.logger(format, ...args);
  }

  /**
   * @abstract
   * @returns {Promise<void>}
   */
  async run() {
    throw new Error("Not Implemented");
  }
};
