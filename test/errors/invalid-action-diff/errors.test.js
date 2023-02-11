import { runErrorTest } from "../../utils/runTest.js";

runErrorTest(import.meta.url, { env: { CI: true } });
