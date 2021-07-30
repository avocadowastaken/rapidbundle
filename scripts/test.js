import execa from "execa";

const mode = process.argv.includes("--watch")
  ? "watch"
  : process.argv.includes("--coverage")
  ? "coverage"
  : "integration";

/** @type {string[]} */
const command = ["npx", "jest"];

if (mode === "watch") command.push("--watch");
if (mode === "coverage") command.unshift("c8", "--reporter", "lcov");

execa.commandSync(command.join(" "), {
  stdio: "inherit",
  env: {
    TEST_BUNDLE: String(mode === "integration"),
    NODE_OPTIONS: "--no-warnings --experimental-vm-modules",
  },
});
