import GithubActionsReporter from "vitest-github-actions-reporter";
import { defineConfig } from "vitest/config";

const isCI = !!process.env["GITHUB_ACTIONS"];

export default defineConfig({
  test: {
    testTimeout: 30_000,
    reporters: isCI ? ["default", new GithubActionsReporter()] : "default",

    coverage: {
      branches: 91,
      functions: 100,
      lines: 95,
      statements: 95,
      reporter: isCI ? ["lcov", "text"] : ["html", "text"],
    },
  },
});
