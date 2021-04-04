import findUp = require("find-up");
import { promises as fs } from "fs";
import { StandardError } from "./StandardError";

export async function findParentFile(
  cwd: string,
  name: string
): Promise<string> {
  const filePath = await findUp(name, { cwd, type: "file" });

  if (!filePath) {
    throw new StandardError(`Failed to find ${name} close to ${cwd}`);
  }

  return filePath;
}

export async function readJSON<T>(filePath: string): Promise<T> {
  try {
    const json = await fs.readFile(filePath, "utf-8");
    return JSON.parse(json);
  } catch {
    throw new StandardError(`Failed to parse ${filePath} to json`);
  }
}
