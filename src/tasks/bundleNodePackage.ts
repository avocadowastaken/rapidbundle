import esbuild, { BuildOptions } from "esbuild";
import path from "node:path";
import type TaskTree from "tasktree-cli";
import type { Task } from "tasktree-cli/lib/Task";
import { compileProjectDefinitions } from "../lib/tsc";
import type { PackageJSON } from "../manifests/PackageJSON";
import { getESBuildBrowsers } from "../utils/browsers";
import { getDistDir, resolveEntry, toModuleID } from "../utils/path";
import { runTask } from "../utils/task";

async function prepareBuildOptions(
  cwd: string,
  task: Task,
  { engines, dependencies, peerDependencies, optionalDependencies }: PackageJSON
): Promise<[base: BuildOptions, node: BuildOptions]> {
  const subTask = task.add("Parsing 'package.json'");
  return runTask(subTask, async () => {
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
        subTask.log(`Using ".${field}" as external: ${external.join(", ")}`);
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
      subTask.log(`Using '.engines.node' entry: ${engines.node}`);
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

  const subTask = task.add("Making '.bin' entry bundle");
  await runTask(subTask, async () => {
    const options = {
      ...baseOptions,
      minify: true,
      outdir: getDistDir(cwd),
      entryPoints: [] as string[],
    } satisfies BuildOptions;

    for (const [name, filePath] of Object.entries(bin)) {
      const entry = await resolveEntry(cwd, filePath);
      options.entryPoints.push(entry);
      subTask.log(`Using '.bin.${name}' entry: ${toModuleID(entry)}`);
    }

    if (type === "module") {
      options.format = "esm";
      subTask.log(`Using '.type' entry: ${type}`);
    }

    await esbuild.build(options);
  });
}

async function bundleEntry(
  task: Task,
  cwd: string,
  entryName: string,
  buildOptions: BuildOptions
): Promise<void> {
  const options = { ...buildOptions } satisfies BuildOptions;

  {
    const entry = await resolveEntry(cwd, entryName);
    options.entryPoints = [entry];
    task.log(`Setting entry point: ${toModuleID(entry)}`);
  }

  {
    options.outfile = path.join(cwd, entryName);
    task.log(`Setting output file: ${entryName}`);
  }

  if (options.platform === "browser") {
    options.target = await getESBuildBrowsers("defaults, Firefox ESR");
    task.log(`Setting build target: ${options.target.join(", ")}`);
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

  const subTask = task.add("Making '.main' entry bundle");
  await runTask(subTask, async () => {
    const options = { ...baseOptions };
    await bundleEntry(subTask, cwd, main, options);
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

  const subTask = task.add("Making '.module' entry bundle");
  await runTask(subTask, async () => {
    const options = {
      ...baseOptions,
      format: "esm",
      platform: "browser",
    } satisfies BuildOptions;

    await bundleEntry(subTask, cwd, module, options);
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

  const subTask = task.add("Making '.types' entry bundle");
  await runTask(subTask, async () => {
    subTask.log("Generating 'd.ts' files");
    const declarationDir = await compileProjectDefinitions(cwd);

    subTask.log("Bundle into single 'd.ts' file");
    const { rollupTypeDeclarations } = await import("../lib/api-extractor");
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
