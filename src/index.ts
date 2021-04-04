import { NodePackageManifest } from "./manifests/NodePackageManifest";
import { BuildNodeTask } from "./tasks/BuildNodeTask";
import { BuildTask } from "./tasks/BuildTask";
import { StandardError } from "./utils/StandardError";

export async function bundle(cwd: string): Promise<void> {
  const manifest = await NodePackageManifest.findPkg(cwd);
  const tasks: BuildTask[] = [new BuildNodeTask({ cwd, manifest })];

  for (const task of tasks) {
    await task.run();
  }
}

if (require.main === module) {
  bundle(process.cwd()).catch((error: unknown) => {
    if (error instanceof StandardError) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  });
}
