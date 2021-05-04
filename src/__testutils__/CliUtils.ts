import { promises as fs } from "fs";
import * as path from "path";
import { bundle } from "../index";
import { PackageJSON } from "../manifests/NodePackageManifest";
import snapshotDiff = require("snapshot-diff");

interface FixtureOutputs {
  main?: string;
}

const builtCode = new Set<string>();
function trackOutputs(outputs: FixtureOutputs): void {
  for (const code of Object.values(outputs)) {
    builtCode.add(code);
  }
}

expect.addSnapshotSerializer({
  test(value: unknown) {
    return typeof value == "string" && builtCode.has(value);
  },
  print(value: unknown) {
    return (value as string).trim();
  },
});

export async function buildFixture(
  code: string,
  pkg: PackageJSON = {}
): Promise<FixtureOutputs> {
  const { testPath, currentTestName } = expect.getState();
  const name = `${path
    .basename(testPath)
    .replace(/\./g, "_")}__${currentTestName}`;

  const pkgDir = path.join(process.cwd(), "node_modules", ".fixtures", name);

  await fs.rm(pkgDir, { force: true, recursive: true });

  const srcDir = path.join(pkgDir, "src");

  await fs.mkdir(srcDir, { recursive: true });

  await fs.writeFile(path.join(srcDir, "index.ts"), code, "utf8");
  await fs.writeFile(
    path.join(pkgDir, "package.json"),
    JSON.stringify({ name, ...pkg }),
    "utf8"
  );

  await bundle(pkgDir);

  const outputs: FixtureOutputs = {};

  if (pkg.main) {
    outputs.main = await fs.readFile(path.join(pkgDir, pkg.main), "utf8");
  }

  trackOutputs(outputs);

  return outputs;
}

export async function injectModule(name: string, code: string) {
  const pkgDir = path.join(process.cwd(), "node_modules", name);

  await fs.rm(pkgDir, { force: true, recursive: true });
  await fs.mkdir(pkgDir, { recursive: true });

  await fs.writeFile(path.join(pkgDir, "index.js"), code, "utf8");
  await fs.writeFile(
    path.join(pkgDir, "package.json"),
    JSON.stringify({
      name,
      exports: { ".": "./index.js" },
    }),
    "utf8"
  );
}
