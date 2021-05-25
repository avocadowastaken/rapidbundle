"use strict";

const path = require("path");
const execa = require("execa");
const assert = require("assert");
const { rollup } = require("rollup");
const { default: rollupPluginDTS } = require("rollup-plugin-dts");

/**
 * @param {string} packageDir
 * @param {import("../manifests/findNodePackage").PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
module.exports = async function bundleTypes(packageDir, packageJSON) {
  assert(packageJSON.types);

  const outfile = path.join(packageDir, packageJSON.types);
  const outDir = path.dirname(outfile);
  const tmpDir = path.join(outDir, "__tmp_declarations");

  await execa(
    "npx",
    [
      "--package",
      "typescript",
      "tsc",
      "--noEmit",
      "false",
      "--declaration",
      "--emitDeclarationOnly",
      "--declarationDir",
      tmpDir,
    ],
    { cwd: packageDir }
  );

  const dtsInput = path.join(tmpDir, "index.d.ts");
  const result = await rollup({
    input: dtsInput,
    plugins: [rollupPluginDTS()],
  });

  await execa("npx", ["rimraf", tmpDir]);
  await result.write({ file: outfile, format: "es" });
};
