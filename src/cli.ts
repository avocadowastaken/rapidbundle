#!/usr/bin/env node
import { run } from "./index";

run({
  cwd: process.cwd(),
  isCI: process.env["CI"] === "true",
}).catch(() => {
  process.exitCode = 1;
});
