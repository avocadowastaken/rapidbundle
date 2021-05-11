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
  Foo: () => Foo
});
var Foo = class {
  #bar;
  constructor(bar) {
    this.#bar = bar;
  }
};
__name(Foo, "Foo");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Foo
});
