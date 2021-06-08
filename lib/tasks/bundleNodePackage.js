import Listr from "listr";
import { bundleBrowserESM } from "./bundleBrowserESM.js";
import { bundleNodeCJS } from "./bundleNodeCJS.js";
import { bundleTypes } from "./bundleTypes.js";

/**
 * @param {string} cwd
 * @param {import('../manifests/PackageJSON.js').PackageJSON} packageJSON
 * */
export function bundleNodePackage(cwd, packageJSON) {
  return new Listr([
    {
      title: "Creating Node (CJS) bundle",
      enabled() {
        return !!packageJSON.main;
      },
      task() {
        return bundleNodeCJS(cwd, packageJSON);
      },
    },
    {
      title: "Creating Browser (ESM) bundle",
      enabled() {
        return !!packageJSON.module;
      },
      task() {
        return bundleBrowserESM(cwd, packageJSON);
      },
    },

    {
      title: "Creating Type declarations",
      enabled() {
        return !!packageJSON.types;
      },
      task() {
        return bundleTypes(cwd, packageJSON);
      },
    },
  ]);
}