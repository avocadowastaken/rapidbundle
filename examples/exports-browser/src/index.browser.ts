export function toBase64(input: string): string {
  return btoa(input);
}

export function fromBase64(input: string): string {
  return atob(input);
}
