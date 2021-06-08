import assert from "assert";
import execa from "execa";
import path from "path";
import { rollup } from "rollup";
import rollupPluginDTS from "rollup-plugin-dts";
import { rmrf } from "../utils/fs.js";

/**
 * @param {string} cwd
 * @param {import("../manifests/PackageJSON.js").PackageJSON} packageJSON
 * @returns {Promise<void>}
 */
export async function bundleTypes(cwd, packageJSON) {
  assert(packageJSON.types);

  const outfile = path.join(cwd, packageJSON.types);
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
    { cwd }
  );

  const dtsInput = path.join(tmpDir, "index.d.ts");
  const result = await rollup({
    input: dtsInput,
    plugins: [rollupPluginDTS()],
  });

  await rmrf(tmpDir);

  await result.write({ file: outfile, format: "es" });
}
