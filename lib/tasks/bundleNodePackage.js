import Listr from "listr";
import { bundleBrowserESM } from "./bundleBrowserESM.js";
import { bundleNodeCJS } from "./bundleNodeCJS.js";
import { bundleTypes } from "./bundleTypes.js";

/** @param {import('../manifests/NodePackage.js').NodePackage} nodePackage */
export function bundleNodePackage(nodePackage) {
  return new Listr([
    {
      title: "Creating Node (CJS) bundle",
      enabled() {
        return !!nodePackage.packageJSON.main;
      },
      task() {
        return bundleNodeCJS(nodePackage);
      },
    },
    {
      title: "Creating Browser (ESM) bundle",
      enabled() {
        return !!nodePackage.packageJSON.module;
      },
      task() {
        return bundleBrowserESM(nodePackage);
      },
    },

    {
      title: "Creating Type declarations",
      enabled() {
        return !!nodePackage.packageJSON.types;
      },
      task() {
        return bundleTypes(nodePackage);
      },
    },
  ]);
}
