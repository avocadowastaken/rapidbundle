var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __name = (target, value) => __defProp(target, "name", {value, configurable: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// src/index.ts
__markAsModule(exports);
__export(exports, {
  logger: () => logger
});

// ../../node_modules/lodash-es/isObjectLike.js
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
__name(isObjectLike, "isObjectLike");
var isObjectLike_default = isObjectLike;

// src/index.ts
var debug = require("debug");
var logger = debug("app");
if (isObjectLike_default(console))
  logger.log = console.log;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  logger
});
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
