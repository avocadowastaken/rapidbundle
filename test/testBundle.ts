import path from "node:path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, test, vi } from "vitest";
import { rmrf } from "../src/utils/fs";
import { git } from "../src/utils/git";
import { getDistDir } from "../src/utils/path";

export type TestBundleOptions = {
  isCI?: boolean;
};

export function testBundle(
  fileUrl: string,
  { isCI = false }: TestBundleOptions,
  fn: () => Promise<void>
) {
  const testPath = fileURLToPath(fileUrl);
  const testDir = path.dirname(testPath);
  const testName = path.basename(testDir);

  beforeEach(async () => {
    vi.stubEnv("NO_TTY", "1");
    vi.stubEnv("CI", isCI ? "1" : "");
    vi.stubEnv("BROWSERSLIST_IGNORE_OLD_DATA", "true");
    vi.spyOn(process, "cwd").mockReturnValue(testDir);
  });

  afterEach(async ({ meta }) => {
    if (meta.result?.state === "fail") {
      return;
    }

    const distDir = getDistDir(testDir);

    await rmrf(distDir);

    try {
      await git("checkout", "HEAD", "--", distDir);
    } catch {
      // noop
    }
  });

  test(testName, fn);
}
