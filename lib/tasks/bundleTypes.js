import assert from "assert";
import execa from "execa";
import path from "path";
import { rollup } from "rollup";
import rollupPluginDTS from "rollup-plugin-dts";
import { rmrf } from "../utils/fs.js";

/**
 * @param {import("../manifests/NodePackage.js").NodePackage} nodePackage
 * @returns {Promise<void>}
 */
export async function bundleTypes(nodePackage) {
  const { packageDir, packageJSON } = nodePackage;

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

  await rmrf(tmpDir);

  await result.write({ file: outfile, format: "es" });
}
