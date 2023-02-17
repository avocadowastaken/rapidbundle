import type { ExtractorMessage } from "@microsoft/api-extractor";
import path from "node:path";
import { rmrf } from "../utils/fs";
import { resolveEntry } from "../utils/path";

async function prepareConfig(
  cwd: string,
  typesEntry: string,
  declarationDir: string
) {
  const { ExtractorConfig } = await import("@microsoft/api-extractor");
  const entry = await resolveEntry(declarationDir, typesEntry);
  return ExtractorConfig.prepare({
    packageJsonFullPath: path.join(cwd, "package.json"),
    configObjectFullPath: path.join(cwd, "api-extractor.json"),
    configObject: {
      projectFolder: cwd,
      compiler: {
        tsconfigFilePath: path.join(cwd, "tsconfig.json"),
      },
      dtsRollup: {
        enabled: true,
        untrimmedFilePath: path.join(cwd, typesEntry),
      },
      mainEntryPointFilePath: path.join(declarationDir, entry),
    },
  });
}

function messageCallback(message: ExtractorMessage): void {
  // @ts-expect-error Import of the const enum `ExtractorLogLevel` fails.
  message.logLevel = "none";
}

export async function rollupTypeDeclarations(
  cwd: string,
  typesEntry: string,
  declarationDir: string
) {
  const { Extractor } = await import("@microsoft/api-extractor");
  const extractorConfig = await prepareConfig(cwd, typesEntry, declarationDir);
  const extractorResult = Extractor.invoke(extractorConfig, {
    messageCallback,
  });

  await rmrf(declarationDir);

  if (!extractorResult.succeeded) {
    throw new Error(
      `API Extractor completed with ${extractorResult.errorCount} errors` +
        ` and ${extractorResult.warningCount} warnings`
    );
  }
}
