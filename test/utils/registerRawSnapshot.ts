import { expect } from "vitest";

const snapshots = new Set<string>();

expect.addSnapshotSerializer({
  test(value) {
    return typeof value == "string" && snapshots.has(value);
  },
  serialize(value) {
    return String(value);
  },
});

export function registerRawSnapshot(value: string): void {
  snapshots.add(value);
}
