import { hello } from "./hello";
import { warning } from "./warning";

/** @deprecated */
export function hi(name: string): string {
  warning(true, "'hi' is deprecated, use 'hello'");
  return hello(name);
}
