export type TaskContext = {
  cwd: string;
  ci: boolean;
  noTTY: boolean;
};

export function createTaskContext(currentProcess: NodeJS.Process): TaskContext {
  return {
    cwd: currentProcess.cwd(),
    ci: !!currentProcess.env["CI"],
    noTTY: !!currentProcess.env["NO_TTY"],
  };
}
