#!/usr/bin/env node
// 入口。本体は packages/ops/src/blog/measure-gsc-impact.mjs (週次 workflow・skill がこのパスで起動する)
// 再現コマンドが指す CLI のパスはこの入口のものなので、ここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/blog/measure-gsc-impact.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({ scriptPath: ".claude/scripts/blog/measure-gsc-impact.mjs" });
}
