#!/usr/bin/env node
// 入口。本体は packages/ops/src/audit/client-graph-audit.mjs (週次 workflow・品質ゲートがこのパスで起動する)
// baseline の JSON と再現コマンドが指す入口のパスは .claude のものなので、ここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/audit/client-graph-audit.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({
    baselinePath: ".claude/config/client-graph-baseline.json",
    scriptPath: ".claude/scripts/audit/client-graph-audit.mjs",
  });
}
