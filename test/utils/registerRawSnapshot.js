/** @type {Set<string>} */
const snapshots = new Set();

expect.addSnapshotSerializer({
  test(value) {
    return typeof value == "string" && snapshots.has(value);
  },
  serialize(value) {
    return String(value);
  },
});

/** @param {string} value */
export function registerRawSnapshot(value) {
  snapshots.add(value);
}
