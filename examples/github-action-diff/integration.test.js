import { runIntegrationTest } from "../../test/utils/runTest.js";

runIntegrationTest(import.meta.url, { env: { CI: "true" } });
