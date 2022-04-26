import * as babel from "@babel/core";
import assert from "assert";
import esbuild from "esbuild";
import { execa } from "execa";
import fs from "fs";
import { Listr } from "listr2";
import path from "path";
import { rollup } from "rollup";
import rollupPluginDTS from "rollup-plugin-dts";
import { getESBuildBrowsers } from "../utils/browsers.js";
import { rmrf } from "../utils/fs.js";
import { formatRelativePath, getDistDir, resolveEntry } from "../utils/path.js";

/**
 * @typedef {import('@babel/core').TransformCaller} ESBuildTransformCaller
 * @property {boolean} supportsProcessEnv
 */

/**
 * @param {import('@babel/core').TransformOptions} options
 * @returns {esbuild.Plugin}
 */
function buildESBuildBabelPlugin(options) {
  const TS_EXTENSION_PATTERN = /^\.tsx?$/;
  const filter =
    typeof options.test === "string" ? new RegExp(options.test) : /.*/;

  return {
    name: "esbuild-plugin-babel",
    setup(build) {
      const isESM = build.initialOptions.format === "esm";

      /** @type {import('@babel/core').TransformCaller & { supportsProcessEnv: boolean }} */
      const caller = {
        name: "esbuild-plugin-babel",
        supportsTopLevelAwait: false,

        supportsStaticESM: isESM,
        supportsDynamicImport: isESM,
        supportsExportNamespaceFrom: isESM,
        supportsProcessEnv: build.initialOptions.platform === "node",
      };

      build.onLoad({ filter }, async (args) => {
        const ext = path.extname(args.path);
        const code = await fs.promises.readFile(args.path, "utf8");

        const esbuildResult = await esbuild.transform(code, {
          logLevel: "silent",
          format: "esm",
          target: "es2020",
          loader: TS_EXTENSION_PATTERN.test(ext) ? "tsx" : "jsx",
        });

        const babelResult = await babel.transformAsync(esbuildResult.code, {
          caller,

          code: true,
          babelrc: false,
          configFile: false,
          filename: args.path,

          plugins: options.plugins,
          presets: options.presets,
        });

        return {
          loader: "js",
          contents:
            /** @type {string} */
            (/** @type {babel.BabelFileResult} */ (babelResult).code),
        };
      });
    },
  };
}

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

        if (
          packageJSON.babel &&
          (packageJSON.babel.presets || packageJSON.babel.plugins)
        ) {
          if (packageJSON.babel.test) {
            task.output = `Using '.babel.test' entry.`;
          }

          if (packageJSON.babel.presets) {
            task.output = `Using '.babel.presets' entry.`;
          }

          if (packageJSON.babel.plugins) {
            task.output = `Using '.babel.plugins' entry.`;
          }

          baseOptions.plugins = [
            buildESBuildBabelPlugin(
              /** @type {import('@babel/core').TransformOptions}*/
              (packageJSON.babel)
            ),
          ];
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
          options.target = getESBuildBrowsers(
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

        await execa(
          "npx",
          [
            // Suppress output from npx itself.
            "--quiet",

            // Ensure that it will pick project TypeScript package.
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

        const entry = await resolveEntry(tmpDir, packageJSON.types);

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
