#!/usr/bin/env node
import cac from "cac";
import { version } from "../package.json";
import { run } from "./index";

const cli = cac("rapidbundle")
  .help()
  .version(version)
  .option("--silent", "Hide output", { default: false })
  .option("--ci", "Running in CI", { default: process.env["CI"] === "true" });

const { options } = cli.parse();

if (!options["help"]) {
  try {
    await run({
      cwd: process.cwd(),
      isCI: options["ci"],
      isSilent: options["silent"],
    });
  } catch {
    process.exitCode = 1;
  }
}
