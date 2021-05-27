"use strict";

import { runErrorTest, runIntegrationTest } from "./utils/runTest.js";

Object.defineProperty(global, "runErrorTest", {
  get() {
    return runErrorTest;
  },
});

Object.defineProperty(global, "runIntegrationTest", {
  get() {
    return runIntegrationTest;
  },
});
