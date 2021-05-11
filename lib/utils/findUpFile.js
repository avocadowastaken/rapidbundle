const findUp = require("find-up");
const StandardError = require("../utils/StandardError");

/**
 * @param {string} cwd
 * @param {string} name
 * @returns {Promise<string>}
 */
module.exports = async function findUpFile(cwd, name) {
  const filePath = await findUp(name, { cwd, type: "file" });

  if (!filePath) {
    throw new StandardError(`Failed to find ${name} close to ${cwd}`);
  }

  return filePath;
};
