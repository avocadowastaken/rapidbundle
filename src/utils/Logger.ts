import debug = require("debug");

export function createLogger(...namespace: string[]): debug.Debugger {
  const logger = debug(["rapidbundle", ...namespace].join(":"));
  logger.log = console.log.bind(console);
  return logger;
}
