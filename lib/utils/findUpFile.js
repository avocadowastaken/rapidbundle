const path = require("path");
const findUp = require("find-up");

/**
 * @param {string} input
 * @param {string} fileName
 * @returns {Promise<string | undefined>}
 */

module.exports = async function findUpFile(input, fileName) {
  if (!path.isAbsolute(input)) input = path.resolve(input);
  if (path.basename(input) === fileName) return input;
  return findUp(fileName, { type: "file", cwd: input });
};
