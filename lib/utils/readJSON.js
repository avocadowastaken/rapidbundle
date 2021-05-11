const { promises: fs } = require("fs");
const StandardError = require("./StandardError");

/** @param {string} filePath */
module.exports = async function readJSON(filePath) {
  try {
    const json = await fs.readFile(filePath, "utf-8");
    return JSON.parse(json);
  } catch {
    throw new StandardError(`Failed to parse ${filePath} to json`);
  }
};
