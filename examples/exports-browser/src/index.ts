export function toBase64(input: string): string {
  return Buffer.from(input, "utf8").toString("base64");
}

export function fromBase64(input: string): string {
  return Buffer.from(input, "base64").toString("utf8");
}
