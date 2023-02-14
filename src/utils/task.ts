import type TaskTree from "tasktree-cli";
import type { Task } from "tasktree-cli/lib/Task";
import type { ITaskTreeOptions } from "tasktree-cli/lib/TaskTree";
import { ValidationError } from "./validation";

export async function runTaskTree(
  tree: TaskTree,
  options: ITaskTreeOptions,
  fn: () => Promise<void>
): Promise<void> {
  tree.start(options);
  await fn();
  tree.stop();
}

export type TaskGenerator<T = void> = AsyncGenerator<string, T>;
export type TaskProcess<T = void> = Promise<T> | TaskGenerator<T>;

function processTaskError(task: Task, error: unknown): never {
  if (error instanceof ValidationError) {
    task.error(error.message, true);
  }

  if (error instanceof Error) {
    task.error(error.stack || error.message, true);
  }

  task.fail();
}

async function processTaskGenerator<T>(
  task: Task,
  generator: TaskGenerator<T>
): Promise<T> {
  let next: IteratorResult<string, T>;
  do {
    next = await generator.next();
    if (!next.done) {
      task.log(next.value);
    }
  } while (!next.done);
  return next.value;
}

export async function runTask<T = void>(
  task: Task,
  fn: () => TaskProcess<T>
): Promise<T> {
  try {
    const taskProcess = fn();
    let taskResult: T;
    if (taskProcess instanceof Promise) {
      taskResult = await taskProcess;
    } else {
      taskResult = await processTaskGenerator(task, taskProcess);
    }

    task.complete();
    return taskResult;
  } catch (error) {
    processTaskError(task, error);
  }
}