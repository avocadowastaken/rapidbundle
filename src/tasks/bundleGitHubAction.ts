import esbuild, { BuildOptions } from "esbuild";
import type TaskTree from "tasktree-cli";
import type { ActionYML } from "../manifests/ActionYML";
import { git } from "../utils/git";
import { getDistDir, resolveEntry, toModuleID } from "../utils/path";
import { runTask } from "../utils/task";
import { ValidationError } from "../utils/validation";

export async function ensureUnchanged(directory: string): Promise<void> {
  await git("add", directory);
  const diff = await git(
    "diff",
    "--cached",
    "--minimal",
    "--unified=0",
    directory
  );

  if (diff) {
    await git("reset", directory);
    const formattedDiff = diff
      .replace(/^diff --git (.+)/gm, "")
      .replace(/^\w+ file mode \d+\n/gm, "")
      .replace(/^index \w{7}\.\.\w{7}( \w{6})?\n/gm, "")
      .replace(/^(-{3}|\+{3}) \/dev\/null\n/gm, "")
      .trimStart();

    throw new ValidationError(`Found build difference:\n${formattedDiff}`);
  }
}

export async function bundleGitHubAction(
  cwd: string,
  isCI: boolean,
  tree: TaskTree,
  { runs: { main, pre, post, using } }: ActionYML
): Promise<void> {
  return runTask(
    tree.add("Making bundle from 'action.yml'"),
    async function* () {
      const distDir = getDistDir(cwd);
      const options = {
        logLevel: "silent",

        bundle: true,
        outdir: distDir,
        keepNames: true,
        platform: "node",
        absWorkingDir: cwd,
        target: using,
        entryPoints: [] as string[],

        external: [
          // Optional dependency of the `node-fetch`.
          "encoding",
        ],

        treeShaking: true,
        define: {
          "process.env.NODE_ENV": JSON.stringify("production"),
        },
      } satisfies BuildOptions;

      for (const [name, entryPath] of Object.entries({ main, pre, post })) {
        if (entryPath) {
          const entry = await resolveEntry(cwd, entryPath);
          options.entryPoints.push(entry);
          yield `Using '.runs.${name}' entry: ${toModuleID(entry)}`;
        }
      }

      yield `Using '.runs.using' entry: ${options.target}`;
      await esbuild.build(options);

      if (isCI) {
        yield "Checking build difference";
        await ensureUnchanged(distDir);
      }
    }
  );
}
