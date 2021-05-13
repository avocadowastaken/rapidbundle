/** @type {Set<string>} */
const snapshots = new Set();

expect.addSnapshotSerializer({
  test(value) {
    return typeof value == "string" && snapshots.has(value);
  },
  print(value) {
    return String(value);
  },
});

/** @param {string} value */
module.exports = function registerRawSnapshot(value) {
  snapshots.add(value);
};
