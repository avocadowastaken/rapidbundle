const resolveModule = require("resolve");

/**
 * @param {string} input
 * @param {string} basedir
 * @returns {Promise<string>}
 */
module.exports = function resolveEntry(input, basedir) {
  return new Promise((resolve, reject) => {
    resolveModule(
      input,
      { basedir, extensions: [".tsx", ".ts", ".js"] },
      (err, resolved) => {
        if (err) reject(err);
        else resolve(/** @type {string} */ (resolved));
      }
    );
  });
};
