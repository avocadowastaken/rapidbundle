import assert from "assert";
import esbuild from "esbuild";
import Listr from "listr";
import { formatRelativePath, resolveEntry } from "../utils/path.js";
import { getMinVersion } from "../utils/version.js";

const CONFLICTING_CONDITIONS = [
  ["node", "browser"],
  ["import", "require"],
  ["development", "production"],
];

/**
 * @typedef {[inputPath: string, entryPath: string, conditions: string[]]} ExportEntry
 */

/**
 * @param {ExportEntry} entry
 */
function validateEntry(entry) {
  const [inputPath, outputFile, conditions] = entry;

  if (inputPath.endsWith("/") || inputPath.endsWith("/*")) {
    throw new Error(
      `Failed to build '${outputFile}', subpath export patterns are not supported: ${inputPath}`
    );
  }

  for (const group of CONFLICTING_CONDITIONS) {
    const hasConflicts =
      group.length ===
      group.filter((condition) => conditions.includes(condition)).length;

    if (hasConflicts) {
      throw new Error(
        `Failed to build '${outputFile}', there are conflicting conditions: ${group.join(
          ", "
        )}.`
      );
    }
  }
}

/**
 * @param {unknown} input
 * @param {object} [options]
 * @param {string} options.inputPath
 * @param {string[]} options.conditions
 * @param {ExportEntry[]} options.entries
 * @returns {ExportEntry[]}
 */
export function parsePackageExports(
  input,
  options = { inputPath: ".", entries: [], conditions: [] }
) {
  const { entries, conditions, inputPath } = options;

  if (typeof input === "string") {
    options.entries.push([inputPath, input, conditions]);
  } else if (Array.isArray(input)) {
    for (const value of input) {
      parsePackageExports(value, {
        entries,
        inputPath,
        conditions,
      });
    }
  } else if (typeof input === "object" && input != null) {
    for (const [key, value] of Object.entries(input)) {
      const childConditions =
        key === "default" || key.startsWith(".")
          ? conditions
          : [...conditions, key];

      parsePackageExports(value, {
        entries,
        conditions: childConditions,
        inputPath: key.startsWith(".") ? key : inputPath,
      });
    }
  }

  return options.entries;
}

/**
 * @param {import('../manifests/NodePackage.js').NodePackage} nodePackage
 */
export function bundleNodePackage(nodePackage) {
  const tasks = new Listr();
  const { packageDir, packageJSON } = nodePackage;
  const entries = parsePackageExports(packageJSON.exports);

  /** @type {string} */
  let nodeTarget = "node12";
  /** @type {string[]} */
  const browserTargets = ["chrome88", "edge89", "firefox78", "safari14"];

  tasks.add({
    title: "Resolving settings",
    task(_, task) {
      if (packageJSON.engines && packageJSON.engines.node) {
        const minVersion = getMinVersion(packageJSON.engines.node);
        assert(minVersion);
        nodeTarget = `node${minVersion}`;
      }

      task.output = `Resolved Node target version: ${nodeTarget}`;
      task.output = `Resolved Browser target versions: ${browserTargets.join(
        ", "
      )}`;
    },
  });

  /** @type {Set<string>} */
  const builtOutputs = new Set();

  for (const entry of entries) {
    const [, outputFile, conditions] = entry;
    let title = `Bundling '${outputFile}'`;

    if (conditions.length) {
      title += ` (${conditions.join(", ")})`;
    }

    tasks.add({
      title,
      task(_, task) {
        validateEntry(entry);

        if (builtOutputs.has(outputFile)) {
          throw new Error(
            `Failed to bundle: ${outputFile} was already bundled by another export.`
          );
        }

        builtOutputs.add(outputFile);

        /** @type {esbuild.BuildOptions} */
        const options = { bundle: true, logLevel: "silent" };

        {
          options.outfile = outputFile;
          task.output = `Using output file: ${options.outfile}`;
        }

        {
          const entryPoint = resolveEntry(packageDir, outputFile);
          options.entryPoints = [entryPoint];
          task.output = `Using entry points: ${formatRelativePath(
            packageDir,
            entryPoint
          )}`;
        }

        if (conditions.length) {
          options.conditions = conditions;
          task.output = `Using conditions: ${conditions.join(", ")}`;
        }

        {
          /** @type {"development" | "production"} */
          const mode = conditions.includes("development")
            ? "development"
            : "production";

          options.define = {
            "import.meta.MODE": JSON.stringify(mode),
            "import.meta.NODE_ENV": JSON.stringify(mode),
            "process.env.NODE_ENV": JSON.stringify(mode),

            "import.meta.DEV": JSON.stringify(mode === "development"),
            "import.meta.PROD": JSON.stringify(mode === "production"),
          };

          task.output = `Using mode: ${mode}`;
        }

        {
          options.platform = conditions.includes("node")
            ? "node"
            : conditions.includes("browser")
            ? "browser"
            : "neutral";

          task.output = `Using platform: ${options.platform}`;

          options.keepNames =
            options.platform === "node" || options.platform === "neutral";
        }

        {
          options.format = conditions.includes("require") ? "cjs" : "esm";
          task.output = `Using format: ${options.format}`;
        }

        {
          if (options.platform === "node") {
            options.target = [nodeTarget];
          } else if (options.platform === "browser") {
            options.target = [...browserTargets];
          } else {
            options.target = [nodeTarget, ...browserTargets];
          }

          task.output = `Using target: ${options.target.join(", ")}`;
        }

        {
          options.external = Object.keys({
            ...packageJSON.dependencies,
            ...packageJSON.peerDependencies,
            ...packageJSON.optionalDependencies,
          });

          if (options.external.length) {
            task.output = `Using external: ${options.external.join(", ")}`;
          }
        }

        return esbuild.build(options);
      },
    });
  }

  return tasks;
}
