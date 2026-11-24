#!/usr/bin/env node
// 入口。本体は packages/ops/src/metrics/check-revenue-guards.mjs (週次 workflow・品質ゲートがこのパスで起動する)
// 閾値 SSOT (.claude/config) と「再現」欄のコマンドのパスはここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/metrics/check-revenue-guards.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({
    configPath: ".claude/config/revenue-guards.json",
    scriptPath: ".claude/scripts/metrics/check-revenue-guards.mjs",
  });
}
