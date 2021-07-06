import { warning } from "./warning";

export function hello(name: string): string {
  warning(typeof name == "string", "'name' expected to be a string.");
  return `Hello, ${name}`;
}
