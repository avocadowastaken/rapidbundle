import type { Task } from "tasktree-cli/lib/Task";
import { ValidationError } from "./validation";

function cleanupErrorMessage(input: string): string {
  return input.replace(/([{}])/g, "\\\\$1");
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return undefined;
}

function processTaskError(task: Task, error: unknown): never {
  const errorMessage = getErrorMessage(error);

  if (errorMessage) {
    task.error(cleanupErrorMessage(errorMessage), true);
  }

  task.fail();
}

export async function runTask<T>(task: Task, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    task.complete();
    return result;
  } catch (error) {
    processTaskError(task, error);
  }
}
