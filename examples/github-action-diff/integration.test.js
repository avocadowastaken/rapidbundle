import { testExample } from "../../test/testExample.js";

testExample(import.meta.url, { env: { CI: "true" } });
