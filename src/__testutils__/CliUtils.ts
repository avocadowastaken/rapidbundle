import { promises as fs } from "fs";
import * as path from "path";
import { bundle } from "../index";
import snapshotDiff = require("snapshot-diff");

interface FixtureOptions {
  main?: string;
  engines?: { node?: string };
}

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
    return value as string;
  },
});

export async function buildFixture(
  name: string,
  code: string,
  options: FixtureOptions = {}
): Promise<FixtureOutputs> {
  const pkgDir = path.join(process.cwd(), "node_modules", "__fixtures__", name);

  await fs.rm(pkgDir, { force: true, recursive: true });

  const srcDir = path.join(pkgDir, "src");

  await fs.mkdir(srcDir, { recursive: true });

  await fs.writeFile(path.join(srcDir, "index.ts"), code, "utf8");
  await fs.writeFile(
    path.join(pkgDir, "package.json"),
    JSON.stringify({ name, ...options }),
    "utf8"
  );

  await bundle(pkgDir);

  const outputs: FixtureOutputs = {};

  if (options.main) {
    outputs.main = await fs.readFile(path.join(pkgDir, options.main), "utf8");
  }

  trackOutputs(outputs);

  return outputs;
}

export async function buildFixturesDiff(
  name: string,
  code: string,
  optionsA: FixtureOptions,
  optionsB: FixtureOptions
): Promise<FixtureOutputs> {
  const outputsA = await buildFixture(name, code, optionsA);
  const outputsB = await buildFixture(name, code, optionsB);
  const allKeys = new Set([
    ...Object.keys(outputsA),
    ...Object.keys(outputsB),
  ] as Array<keyof FixtureOutputs>);

  const outputs: FixtureOutputs = {};
  for (const key of allKeys) {
    outputs[key] = snapshotDiff(outputsA[key], outputsB[key], {
      contextLines: 2,
      stablePatchmarks: true,
    });
  }
  return outputs;
}
