"use strict";

const path = require("path");
const execa = require("execa");
const assert = require("assert");
const { rollup } = require("rollup");
const { default: rollupPluginDTS } = require("rollup-plugin-dts");

const createLogger = require("../utils/createLogger");
const log = createLogger("build", "task", "types");

/**
 * @param {string} entryPoint
 * @param {string} packageDir
 * @param {import('../manifests/findPackageJSON').PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
module.exports = async function bundleTypes(
  entryPoint,
  packageDir,
  packageJSON
) {
  assert(packageJSON.types);

  const outfile = path.join(packageDir, packageJSON.types);
  const outDir = path.dirname(outfile);
  const tmpDir = path.join(outDir, "__tmp_declarations");

  log("creating type definitions for: %s", packageDir);

  await execa(
    "npx",
    [
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

  const entryFileName = path.basename(entryPoint);

  const dtsInput = path.join(
    tmpDir,
    entryFileName.replace(path.extname(entryFileName), ".d.ts")
  );

  log("rolling up %s", dtsInput);

  const result = await rollup({
    input: path.join(
      tmpDir,
      entryFileName.replace(path.extname(entryFileName), ".d.ts")
    ),
    plugins: [rollupPluginDTS()],
  });

  log("removing tmp dir: %s", tmpDir);
  await execa("npx", ["rimraf", tmpDir]);

  log("writing into: %s", outfile);
  await result.write({ file: outfile, format: "es" });
};
