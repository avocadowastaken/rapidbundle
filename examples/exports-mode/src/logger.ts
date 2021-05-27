import debug from "debug";

export const logger = debug("app:logger");

if (process.env.NODE_ENV === "development") {
  logger.log = console.log.bind(console);
}
