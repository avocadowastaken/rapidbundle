"use strict";

import { runIntegrationTest } from "./utils/runIntegrationTest";

Object.defineProperty(global, "runIntegrationTest", {
  get() {
    return runIntegrationTest;
  },
});
