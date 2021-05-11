var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __name = (target, value) => __defProp(target, "name", {value, configurable: true});
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = {exports: {}}).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// ../../node_modules/isobject/index.js
var require_isobject = __commonJS({
  "../../node_modules/isobject/index.js"(exports, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ __name(function isObject2(val) {
      return val != null && typeof val === "object" && Array.isArray(val) === false;
    }, "isObject");
  }
});

// src/index.ts
__markAsModule(exports);
__export(exports, {
  logger: () => logger
});
var debug = require("debug");
var isObject = require_isobject();
var logger = debug("app");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  logger
});
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
