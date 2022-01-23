import { hello } from "./hello";

declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      NODE_ENV?: string;
      INPUT_NAME?: string;
    }
  }
}

function main() {
  const name = process.env.INPUT_NAME || "unknown";
  if (
    name !== process.env.INPUT_NAME &&
    process.env.NODE_ENV !== "production"
  ) {
    console.warn(
      `INPUT_NAME was not provided, so we replaced it with: ${name}`
    );
  }
  console.log(hello(name));
}

main();
