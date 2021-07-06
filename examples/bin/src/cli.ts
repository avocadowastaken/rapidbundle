#!/usr/bin/env node

import { hello } from "./hello";

console.log(hello(process.argv[3] as string));
