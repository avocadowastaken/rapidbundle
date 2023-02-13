import fs from "node:fs/promises";

export function rmrf(input: string): Promise<void> {
  return fs.rm(input, { force: true, recursive: true });
}

export async function isFile(input: string): Promise<boolean> {
  try {
    const stat = await fs.stat(input);
    return stat.isFile();
  } catch {
    return false;
  }
}
