import { testError } from "../../testError";

testError(import.meta.url, { isCI: true });
