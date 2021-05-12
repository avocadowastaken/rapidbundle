"use strict";

Object.defineProperty(global, "runIntegrationTest", {
  get() {
    return require("./utils/runIntegrationTest");
  },
});
