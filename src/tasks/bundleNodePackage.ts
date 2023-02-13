import esbuild, { BuildOptions } from "esbuild";
import { Listr } from "listr2";
import assert from "node:assert";
import path from "node:path";
import type { Plugin } from "rollup";
import type { PackageJSON } from "../manifests/PackageJSON";
import { getESBuildBrowsers } from "../utils/browsers";
import { execNode } from "../utils/exec";
import { rmrf } from "../utils/fs";
import {
  formatRelativePath,
  getDistDir,
  resolveEntry,
  resolvePackageBin,
} from "../utils/path";

export function bundleNodePackage(cwd: string, packageJSON: PackageJSON) {
  const baseOptions: BuildOptions = {
    bundle: true,
    logLevel: "silent",
  };

  const baseNodeOptions: BuildOptions = {
    format: "cjs",
    target: "node12",
    platform: "node",

    // `node-fetch` checks for the `AbortController` name.
    keepNames: true,
  };

  return new Listr([
    {
      title: "Parsing 'package.json'",
      task(_, task) {
        {
          const dependenciesFields = [
            "dependencies",
            "peerDependencies",
            "optionalDependencies",
          ] as const;

          baseOptions.external = [];

          for (const field of dependenciesFields) {
            const external = Object.keys(packageJSON[field]);
            if (external.length) {
              baseOptions.external.push(...external);
              task.output = `Using ".${field}" as external: ${external.join(
                ", "
              )}`;
            }
          }
        }

        if (packageJSON.engines && packageJSON.engines.node) {
          baseNodeOptions.target = `node${packageJSON.engines.node}`;
          task.output = `Using '.engines.node' entry: ${packageJSON.engines.node}`;
        }
      },
    },

    {
      title: "Making '.bin' entry bundle",
      enabled() {
        return !!packageJSON.bin;
      },
      async task(_, task) {
        assert(packageJSON.bin);

        const options: BuildOptions = {
          ...baseOptions,
          ...baseNodeOptions,

          minify: true,
          outdir: getDistDir(cwd),
        };

        const entryPoints: string[] = [];
        for (const [name, bin] of Object.entries(packageJSON.bin)) {
          const entry = await resolveEntry(cwd, bin);
          entryPoints.push(entry);
          task.output = `Using '.bin.${name}' entry: ${formatRelativePath(
            cwd,
            entry
          )}`;
        }
        options.entryPoints = entryPoints;

        if (packageJSON.type === "module") {
          options.format = "esm";
          task.output = `Using '.type' entry: ${packageJSON.type}`;
        }

        await esbuild.build(options);
      },
    },

    {
      title: "Making '.main' entry bundle",
      enabled() {
        return !!packageJSON.main;
      },
      async task(_, task) {
        assert(packageJSON.main);

        const options: BuildOptions = {
          ...baseOptions,
          ...baseNodeOptions,
        };

        {
          const entry = await resolveEntry(cwd, packageJSON.main);
          options.entryPoints = [entry];
          task.output = `Setting entry point: ${formatRelativePath(
            cwd,
            entry
          )}`;
        }

        {
          options.outfile = path.join(cwd, packageJSON.main);
          task.output = `Setting output file: ${packageJSON.main}`;
        }

        await esbuild.build(options);
      },
    },

    {
      title: "Making '.module' entry bundle",
      enabled() {
        return !!packageJSON.module;
      },
      async task(_, task) {
        assert(packageJSON.module);

        const options: BuildOptions = {
          ...baseOptions,

          format: "esm",
          platform: "browser",
        };

        {
          const entry = await resolveEntry(cwd, packageJSON.module);
          options.entryPoints = [entry];
          task.output = `Setting entry point: ${formatRelativePath(
            cwd,
            entry
          )}`;
        }

        {
          options.outfile = path.join(cwd, packageJSON.module);
          task.output = `Setting output file: ${packageJSON.module}`;
        }

        {
          options.target = await getESBuildBrowsers(
            "defaults, Firefox ESR, not IE 11"
          );

          task.output = `Setting build target: ${options.target.join(", ")}`;
        }

        await esbuild.build(options);
      },
    },

    {
      title: "Making '.types' entry bundle",
      enabled() {
        return !!packageJSON.types;
      },
      async task(_, task) {
        assert(packageJSON.types);

        const distDir = getDistDir(cwd);
        const tmpDir = path.join(distDir, "__tmp_declarations");

        task.output = "Generating 'd.ts' files";

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
            tmpDir,
          ],
          { cwd }
        );

        task.output = "Bundle into single 'd.ts' file";

        const entry = await resolveEntry(tmpDir, packageJSON.types);
        const { rollup } = await import("rollup");
        const { default: rollupPluginDTS } = await import("rollup-plugin-dts");

        const result = await rollup({
          input: entry,
          plugins: [rollupPluginDTS() as Plugin],
        });

        await rmrf(tmpDir);

        await result.write({
          format: "es",
          file: path.join(cwd, packageJSON.types),
        });
      },
    },
  ]);
}
