const path = require("path");
const findUp = require("find-up");
const StandardError = require("../utils/StandardError");

/**
 * @param {string} input
 * @param {string} fileName
 * @returns {Promise<string>}
 */

module.exports = async function findUpFile(input, fileName) {
  if (!path.isAbsolute(input)) input = path.resolve(input);
  if (path.basename(input) === fileName) return input;
  const filePath = await findUp(fileName, { type: "file", cwd: input });

  if (!filePath) {
    throw new StandardError(`Failed to find ${fileName} close to ${input}`);
  }

  return filePath;
};
