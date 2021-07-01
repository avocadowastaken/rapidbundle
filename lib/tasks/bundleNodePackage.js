import { Listr } from "listr2";
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
      title: "Making 'main' entry bundle",
      enabled() {
        return !!packageJSON.main;
      },
      task() {
        return bundleNodeCJS(cwd, packageJSON);
      },
    },
    {
      title: "Making 'module' entry bundle",
      enabled() {
        return !!packageJSON.module;
      },
      task() {
        return bundleBrowserESM(cwd, packageJSON);
      },
    },

    {
      title: "Making 'types' entry bundle",
      enabled() {
        return !!packageJSON.types;
      },
      task() {
        return bundleTypes(cwd, packageJSON);
      },
    },
  ]);
}
