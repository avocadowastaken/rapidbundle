import { hello } from "./hello";

function main() {
  console.log(hello(process.env.INPUT_NAME || "unknown"));
}

main();
