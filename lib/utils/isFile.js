"use strict";

const { promises: fs } = require("fs");

/**
 * @param {string} input
 * @returns {Promise<boolean>}
 */
module.exports = async function isFile(input) {
  try {
    const stat = await fs.stat(input);
    return stat.isFile();
  } catch {
    return false;
  }
};
