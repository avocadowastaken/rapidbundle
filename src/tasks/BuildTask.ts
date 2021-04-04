import { createLogger } from "../utils/Logger";

export interface BuildTaskOptions {
  cwd: string;
}

export abstract class BuildTask {
  readonly #name;
  readonly #logger;
  readonly #options;

  protected constructor(name: string, options: BuildTaskOptions) {
    this.#name = name;
    this.#options = options;
    this.#logger = createLogger("build", "task", name);
  }

  protected get cwd(): string {
    return this.#options.cwd;
  }

  protected log(format: string, ...args: unknown[]): void {
    this.#logger(format, ...args);
  }

  abstract run(): Promise<void>;
}
