var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {value, configurable: true});
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = {exports: {}}).exports, mod), mod.exports;
};

// ../../node_modules/isobject/index.js
var require_isobject = __commonJS({
  "../../node_modules/isobject/index.js"(exports2, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ __name(function isObject2(val) {
      return val != null && typeof val === "object" && Array.isArray(val) === false;
    }, "isObject");
  }
});

// src/index.ts
var isObject = require_isobject();
if (isObject(process)) {
  console.log(process.env);
}
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */
