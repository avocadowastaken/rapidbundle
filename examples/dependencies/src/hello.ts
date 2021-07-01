import stripAnsi from "strip-ansi";

export function hello(name: string): string {
  return `Hello, ${stripAnsi(name)}`;
}
