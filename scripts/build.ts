import { build } from "esbuild";
import * as path from "path";
import * as pkg from "../package.json";

const ROOT_DIR = path.join(__dirname, "..");

async function main(): Promise<void> {
  await build({
    bundle: true,

    target: "node12",
    platform: "node",

    external: Object.keys(pkg.dependencies),

    entryPoints: [path.join(ROOT_DIR, "src", "index.ts")],
    outfile: path.join(ROOT_DIR, "dist", "index.js"),
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
