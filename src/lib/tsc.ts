import path from "node:path";
import { getDistDir } from "../utils/path";
import { ValidationError } from "../utils/validation";

async function loadTS() {
  // TypeScript is using CJS, so only `default` import will work.
  const { default: ts } = await import("typescript");
  return ts;
}

async function prepareConfig(cwd: string, declarationDir: string) {
  const ts = await loadTS();
  const nodeSystem = ts.createSolutionBuilderHost(ts.sys);
  nodeSystem.readDirectory?.(cwd);

  const configFilePath = ts.findConfigFile(cwd, ts.sys.fileExists);
  if (!configFilePath) {
    throw new ValidationError("Failed to resolve 'tsconfig.json'");
  }
  const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile);
  const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);

  // Override `"noEmit": true` config.
  config.options.noEmit = false;

  // Preserve file structure
  config.options.rootDir = cwd;

  // Emit into temporary directory.
  config.options.declaration = true;
  config.options.emitDeclarationOnly = true;
  config.options.declarationDir = declarationDir;
  return config;
}

export async function compileProjectDefinitions(cwd: string): Promise<string> {
  const ts = await loadTS();
  const distDir = getDistDir(cwd);
  const declarationDir = path.join(distDir, ".dst");
  const { options, fileNames, errors } = await prepareConfig(
    cwd,
    declarationDir
  );

  // Override `"noEmit": true` config.
  options.noEmit = false;

  // Preserve file structure
  options.rootDir = cwd;

  // Emit into temporary directory.
  options.declaration = true;
  options.emitDeclarationOnly = true;
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
