import esbuild from "esbuild";
import { Listr } from "listr2";
import assert from "node:assert";
import path from "node:path";
import { getESBuildBrowsers } from "../utils/browsers.js";
import { execNode } from "../utils/exec.js";
import { rmrf } from "../utils/fs.js";
import {
  formatRelativePath,
  getDistDir,
  resolveEntry,
  resolvePackageBin,
} from "../utils/path.js";

/**
 * @param {string} cwd
 * @param {import('../manifests/PackageJSON.js').PackageJSON} packageJSON
 * */
export function bundleNodePackage(cwd, packageJSON) {
  /** @type {esbuild.BuildOptions} */
  const baseOptions = {
    bundle: true,
    logLevel: "silent",
  };

  /** @type {esbuild.BuildOptions} */
  const baseNodeOptions = {
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
        if (packageJSON.version) {
          baseOptions.define = {
            ...baseOptions.define,
            "import.meta.env.__VERSION__": JSON.stringify(packageJSON.version),
          };
        }

        {
          /** @type {ReadonlyArray<'dependencies' | 'peerDependencies' | 'optionalDependencies'>} */
          const dependenciesFields = [
            "dependencies",
            "peerDependencies",
            "optionalDependencies",
          ];

          baseOptions.external = [];

          for (const field of dependenciesFields) {
            const dependencies = packageJSON[field];

            if (dependencies) {
              const external = Object.keys(dependencies);

              if (external.length) {
                baseOptions.external.push(...external);
                task.output = `Using ".${field}" as external: ${external.join(
                  ", "
                )}`;
              }
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
        /** @type {esbuild.BuildOptions} */
        const options = {
          ...baseOptions,
          ...baseNodeOptions,

          minify: true,
          outdir: getDistDir(cwd),
        };

        assert(packageJSON.bin);

        options.entryPoints = [];

        if (typeof packageJSON.bin == "string") {
          const entry = await resolveEntry(cwd, packageJSON.bin);
          task.output = `Using '.bin' entry: ${formatRelativePath(cwd, entry)}`;
          options.entryPoints.push(entry);
        } else {
          const bins = Object.entries(packageJSON.bin);

          for (const [name, bin] of bins) {
            const entry = await resolveEntry(cwd, bin);
            options.entryPoints.push(entry);
            task.output = `Using '.bin.${name}' entry: ${formatRelativePath(
              cwd,
              entry
            )}`;
          }
        }

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
        /** @type {esbuild.BuildOptions} */
        const options = {
          ...baseOptions,
          ...baseNodeOptions,
        };

        assert(packageJSON.main);

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

        /** @type {esbuild.BuildOptions} */
        const options = {
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
          plugins: [rollupPluginDTS()],
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
