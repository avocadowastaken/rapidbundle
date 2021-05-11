import debug = require("debug");
import { isObjectLike } from "lodash-es";

export const logger = debug("app");
if (isObjectLike(console)) logger.log = console.log;
