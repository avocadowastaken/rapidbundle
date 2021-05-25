"use strict";

const ora = require("ora");
const prettyMS = require("pretty-ms");
const CLIError = require("./CLIError");

module.exports = class Logger {
  /** @param {NodeJS.WritableStream} stream */
  constructor(stream) {
    /**
     * @type {NodeJS.WritableStream}
     * @readonly
     * @protected
     */
    this.stream = stream;
  }

  /**
   * @template {unknown} T
   * @param {string} name
   * @param {(spinner: import("ora").Ora) => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async time(name, fn) {
    const spinner = ora({ stream: this.stream }).start(name);

    try {
      const startedAt = Date.now();
      const result = await fn(spinner);
      spinner.succeed(`${name} (${prettyMS(Date.now() - startedAt)})`);
      return result;
    } catch (e) {
      if (e instanceof CLIError) {
        spinner.fail(e.message);
      } else if (e instanceof Error) {
        spinner.fail(e.stack);
      }

      throw e;
    }
  }
};
