import assert from "assert";
import esbuild from "esbuild";
import execa from "execa";
import { Listr } from "listr2";
import path from "path";
import { rollup } from "rollup";
import rollupPluginDTS from "rollup-plugin-dts";
import { rmrf } from "../utils/fs.js";
import {
  formatRelativePath,
  resolveDistDir,
  resolveEntry,
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
      task(_, task) {
        /** @type {esbuild.BuildOptions} */
        const options = {
          ...baseOptions,
          ...baseNodeOptions,

          minify: true,
          outdir: resolveDistDir(cwd),
        };

        assert(packageJSON.bin);

        options.entryPoints = [];

        if (typeof packageJSON.bin == "string") {
          const entry = resolveEntry(cwd, packageJSON.bin);
          task.output = `Using '.bin' entry: ${formatRelativePath(cwd, entry)}`;
          options.entryPoints.push(entry);
        } else {
          const bins = Object.entries(packageJSON.bin);

          for (const [name, bin] of bins) {
            const entry = resolveEntry(cwd, bin);
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

        return esbuild.build(options);
      },
    },

    {
      title: "Making '.main' entry bundle",
      enabled() {
        return !!packageJSON.main;
      },
      task(_, task) {
        /** @type {esbuild.BuildOptions} */
        const options = {
          ...baseOptions,
          ...baseNodeOptions,
        };

        assert(packageJSON.main);

        {
          const entry = resolveEntry(cwd, packageJSON.main);
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

        return esbuild.build(options);
      },
    },

    {
      title: "Making '.module' entry bundle",
      enabled() {
        return !!packageJSON.module;
      },
      task(_, task) {
        assert(packageJSON.module);

        /** @type {esbuild.BuildOptions} */
        const options = {
          ...baseOptions,

          format: "esm",
          platform: "browser",
        };

        {
          const entry = resolveEntry(cwd, packageJSON.module);
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
          // npx browserslist --mobile-to-desktop "defaults, Firefox ESR, not IE 11"
          // TODO: Generate every time.
          const stableBrowsers = [
            "chrome 88",
            "edge 89",
            "firefox 78",
            "safari 14.1",
          ];

          options.target = stableBrowsers.map((browser) =>
            browser.replace(" ", "")
          );

          task.output = `Setting build target: ${options.target.join(", ")}`;
        }

        return esbuild.build(options);
      },
    },

    {
      title: "Making 'types' entry bundle",
      enabled() {
        return !!packageJSON.types;
      },
      async task(_, task) {
        assert(packageJSON.types);

        const distDir = resolveDistDir(cwd);
        const tmpDir = path.join(distDir, "__tmp_declarations");

        task.output = "Generating 'd.ts' files";

        await execa(
          "npx",
          [
            // Suppress output from npx itself.
            "--quiet",

            // Ensure that it will pickup TypeScript package.
            "--package",
            "typescript",

            "tsc",

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

        const entry = resolveEntry(tmpDir, packageJSON.types, "");

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
