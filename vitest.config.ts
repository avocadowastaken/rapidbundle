import GithubActionsReporter from "vitest-github-actions-reporter";
import { defineConfig } from "vitest/config";

const isCI = !!process.env["GITHUB_ACTIONS"];

export default defineConfig({
  test: {
    isolate: true,
    testTimeout: 60_000,
    outputDiffLines: 500,
    outputDiffMaxLines: 500,
    reporters: isCI ? ["default", new GithubActionsReporter()] : "default",
    coverage: { reporter: isCI ? ["lcov", "text"] : ["html", "text"] },
  },
});
