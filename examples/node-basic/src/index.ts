import * as path from "path";
import debug = require("debug");

const logger = debug("app");
logger(path.basename(path.join(__dirname, "..")));
