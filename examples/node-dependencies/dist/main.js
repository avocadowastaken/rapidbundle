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

// ../../node_modules/arrify/index.js
var require_arrify = __commonJS({
  "../../node_modules/arrify/index.js"(exports, module2) {
    "use strict";
    module2.exports = function(val) {
      if (val === null || val === void 0) {
        return [];
      }
      return Array.isArray(val) ? val : [val];
    };
  }
});

// src/index.ts
__markAsModule(exports);
__export(exports, {
  log: () => log
});
var debug = require("debug");
var arrify = require_arrify();
var isObject = require("isobject");
var logger = debug("app");
function log(format, args) {
  logger(format, ...arrify(args));
}
__name(log, "log");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  log
});
