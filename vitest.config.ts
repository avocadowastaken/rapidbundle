import GithubActionsReporter from "vitest-github-actions-reporter";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30_000,
    reporters: process.env["GITHUB_ACTIONS"]
      ? ["default", new GithubActionsReporter()]
      : "default",

    coverage: {
      branches: 91,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
});
