import path from "node:path";
import { getDistDir } from "../utils/path";
import { ValidationError } from "../utils/validation";

async function loadTS() {
  // TypeScript is using CJS, so only `default` import will work.
  const { default: ts } = await import("typescript");
  return ts;
}

async function prepareConfig(cwd: string) {
  const ts = await loadTS();
  const nodeSystem = ts.createSolutionBuilderHost(ts.sys);
  nodeSystem.readDirectory?.(cwd);

  const configFilePath = ts.findConfigFile(cwd, ts.sys.fileExists);
  if (!configFilePath) {
    throw new ValidationError("Failed to resolve 'tsconfig.json'");
  }
  const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);
}

export async function compileProjectDefinitions(cwd: string): Promise<string> {
  const ts = await loadTS();
  const distDir = getDistDir(cwd);
  const declarationDir = path.join(distDir, ".dst");
  const { options, fileNames, errors } = await prepareConfig(cwd);

  // Generate .d.ts files.
  options.declaration = true;
  // Only output d.ts files and not JavaScript files.
  options.emitDeclarationOnly = true;
  // Enable emitting file from a compilation, so it wouldn't conflict with the `emitDeclarationOnly`.
  options.noEmit = false;
  // Preserve file structure
  options.rootDir = cwd;
  // Emit into temporary directory.
  options.declarationDir = declarationDir;

  const program = ts.createProgram(
    fileNames,
    options,
    undefined,
    undefined,
    errors
  );

  program.emit();

  return declarationDir;
}
