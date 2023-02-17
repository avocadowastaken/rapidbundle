#!/usr/bin/env node
import { createTaskContext } from "./ctx";
import { run } from "./index";

const ctx = createTaskContext(process);

try {
  await run(ctx);
} catch {
  process.exitCode = 1;
}
