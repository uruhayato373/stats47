#!/usr/bin/env node
// 入口。本体は packages/ops/src/effect-verdict/write-past-effects.mjs (週次 workflow・skill がこのパスで起動する)
// 台帳の source 欄に書く writer のパスはこの入口のものなので、ここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/effect-verdict/write-past-effects.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({ writerPath: ".claude/scripts/lib/write-past-effects.mjs" });
}
