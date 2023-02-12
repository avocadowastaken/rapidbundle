import { testError } from "../../testError.js";

testError(import.meta.url, { env: { CI: "true" } });
