export function warning(test: boolean, message: string): void {
  if (!test) console.warn("[warn] %s", message);
}
