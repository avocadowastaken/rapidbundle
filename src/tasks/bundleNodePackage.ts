import esbuild, { BuildOptions } from "esbuild";
import path from "node:path";
import type { Plugin } from "rollup";
import type TaskTree from "tasktree-cli";
import type { Task } from "tasktree-cli/lib/Task";
import type { PackageJSON } from "../manifests/PackageJSON";
import { getESBuildBrowsers } from "../utils/browsers";
import { execNode } from "../utils/exec";
import { rmrf } from "../utils/fs";
import {
  getDistDir,
  resolveEntry,
  resolvePackageBin,
  toModuleID,
} from "../utils/path";
import { runTask, TaskGenerator } from "../utils/task";

async function prepareBuildOptions(
  cwd: string,
  task: Task,
  { engines, dependencies, peerDependencies, optionalDependencies }: PackageJSON
): Promise<[base: BuildOptions, node: BuildOptions]> {
  return runTask(task.add("Parsing 'package.json'"), async function* () {
    const baseOptions = {
      bundle: true,
      logLevel: "silent",
      absWorkingDir: cwd,
      external: [] as string[],
    } satisfies BuildOptions;

    for (const [field, values] of Object.entries({
      dependencies,
      peerDependencies,
      optionalDependencies,
    })) {
      const external = Object.keys(values);
      if (external.length) {
        baseOptions.external.push(...external);
        yield `Using ".${field}" as external: ${external.join(", ")}`;
      }
    }

    const baseNodeOptions = {
      ...baseOptions,
      format: "cjs",
      target: "node12",
      platform: "node",

      // `node-fetch` checks for the `AbortController` name.
      keepNames: true,
    } satisfies BuildOptions;

    if (engines?.node) {
      baseNodeOptions.target = `node${engines.node}`;
      yield `Using '.engines.node' entry: ${engines.node}`;
    }

    return [baseOptions, baseNodeOptions];
  });
}

async function bundleBin(
  cwd: string,
  task: Task,
  baseOptions: BuildOptions,
  { bin, type }: PackageJSON
): Promise<void> {
  if (!bin) {
    return;
  }

  await runTask(task.add("Making '.bin' entry bundle"), async function* () {
    const options = {
      ...baseOptions,
      minify: true,
      outdir: getDistDir(cwd),
      entryPoints: [] as string[],
    } satisfies BuildOptions;

    for (const [name, filePath] of Object.entries(bin)) {
      const entry = await resolveEntry(cwd, filePath);
      options.entryPoints.push(entry);
      yield `Using '.bin.${name}' entry: ${toModuleID(entry)}`;
    }

    if (type === "module") {
      options.format = "esm";
      yield `Using '.type' entry: ${type}`;
    }

    await esbuild.build(options);
  });
}

async function* bundleEntry(
  cwd: string,
  entryName: string,
  buildOptions: BuildOptions
): TaskGenerator {
  const options = { ...buildOptions } satisfies BuildOptions;

  {
    const entry = await resolveEntry(cwd, entryName);
    options.entryPoints = [entry];
    yield `Setting entry point: ${toModuleID(entry)}`;
  }

  {
    options.outfile = path.join(cwd, entryName);
    yield `Setting output file: ${entryName}`;
  }

  if (options.platform === "browser") {
    options.target = await getESBuildBrowsers("defaults, Firefox ESR");
    yield `Setting build target: ${options.target.join(", ")}`;
  }

  await esbuild.build(options);
}

async function bundleMain(
  cwd: string,
  task: Task,
  baseOptions: BuildOptions,
  { main }: PackageJSON
): Promise<void> {
  if (!main) {
    return;
  }

  await runTask(task.add("Making '.main' entry bundle"), async function* () {
    const options = { ...baseOptions };
    yield* bundleEntry(cwd, main, options);
  });
}

async function bundleModule(
  cwd: string,
  task: Task,
  baseOptions: BuildOptions,
  { module }: PackageJSON
): Promise<void> {
  if (!module) {
    return;
  }

  await runTask(task.add("Making '.module' entry bundle"), async function* () {
    const options = {
      ...baseOptions,
      format: "esm",
      platform: "browser",
    } satisfies BuildOptions;

    yield* bundleEntry(cwd, module, options);
  });
}

async function compileTypeDeclarations(cwd: string): Promise<string> {
  const distDir = getDistDir(cwd);
  const declarationDir = path.join(distDir, "__tmp_declarations");

  const tsc = resolvePackageBin(cwd, "typescript", "tsc");

  await execNode(
    tsc,
    [
      // Override `"noEmit": true` config.
      "--noEmit",
      "false",

      // Preserve file structure.
      "--rootDir",
      cwd,

      // Emit into temporary directory.
      "--declaration",
      "--emitDeclarationOnly",
      "--declarationDir",
      declarationDir,
    ],
    { cwd }
  );

  return declarationDir;
}

async function rollupTypeDeclarations(
  cwd: string,
  typesEntry: string,
  declarationDir: string
) {
  const entry = await resolveEntry(declarationDir, typesEntry);
  const { rollup } = await import("rollup");
  const { default: rollupPluginDTS } = await import("rollup-plugin-dts");

  const result = await rollup({
    input: path.join(declarationDir, entry),
    plugins: [rollupPluginDTS() as Plugin],
  });

  await rmrf(declarationDir);

  await result.write({
    format: "es",
    file: path.join(cwd, typesEntry),
  });
}

async function bundleTypes(
  cwd: string,
  task: Task,
  { types }: PackageJSON
): Promise<void> {
  if (!types) {
    return;
  }

  await runTask(task.add("Making '.types' entry bundle"), async function* () {
    yield "Generating 'd.ts' files";
    const declarationDir = await compileTypeDeclarations(cwd);

    yield "Bundle into single 'd.ts' file";
    await rollupTypeDeclarations(cwd, types, declarationDir);
  });
}

export async function bundleNodePackage(
  cwd: string,
  tree: TaskTree,
  packageJSON: PackageJSON
): Promise<void> {
  const task = tree.add("Making bundle from 'package.json'");
  return runTask(task, async () => {
    const [baseOptions, baseNodeOptions] = await prepareBuildOptions(
      cwd,
      task,
      packageJSON
    );

    await bundleBin(cwd, task, baseNodeOptions, packageJSON);
    await bundleMain(cwd, task, baseNodeOptions, packageJSON);
    await bundleModule(cwd, task, baseOptions, packageJSON);
    await bundleTypes(cwd, task, packageJSON);
  });
}
