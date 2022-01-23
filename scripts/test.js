import { execaCommandSync } from "execa";

const mode = process.argv.includes("--watch")
  ? "watch"
  : process.argv.includes("--coverage")
  ? "coverage"
  : process.argv.includes("--e2e")
  ? "e2e"
  : null;

/** @type {string[]} */
const command = ["npx", "jest"];

if (mode === "watch") command.push("--watch");
if (mode === "coverage") command.unshift("c8", "--reporter", "lcov");

execaCommandSync(command.join(" "), {
  stdio: "inherit",
  env: {
    TEST_BUNDLE: String(mode === "e2e"),
    NODE_OPTIONS: "--no-warnings --experimental-vm-modules",
  },
});
