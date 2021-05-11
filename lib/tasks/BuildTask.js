"use strict";

const createLogger = require("../utils/createLogger");

/**
 * @typedef {object} BuildTaskOptions
 * @property {string} cwd
 */

module.exports = class BuildTask {
  /**
   * @type {import("debug").Debugger}
   * @readonly
   */
  #logger;

  /**
   * @type {BuildTaskOptions}
   * @readonly
   */
  #options;

  /**
   * @param {string} name
   * @param {BuildTaskOptions} options
   */
  constructor(name, options) {
    this.#options = options;
    this.#logger = createLogger("build", "task", name);
  }

  /**
   * @returns {string}
   * @protected
   */
  get cwd() {
    return this.#options.cwd;
  }

  /**
   * @param {string} format
   * @param {...unknown} args
   * @protected
   */
  log(format, ...args) {
    this.#logger(format, ...args);
  }

  /**
   * @abstract
   * @returns {Promise<void>}
   */
  async run() {
    throw new Error("Not Implemented");
  }
};
