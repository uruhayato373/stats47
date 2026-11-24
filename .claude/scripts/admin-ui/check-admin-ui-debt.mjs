#!/usr/bin/env node
// 入口。本体は packages/ops/src/admin-ui/check-admin-ui-debt.mjs (品質ゲート・pre-commit・workflow・package.json がこのパスで起動する)
// 基準値の JSON・再現コマンドが指す入口・規約のパスは .claude のものなので、ここで渡す (packages は .claude のパスを持たない)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/admin-ui/check-admin-ui-debt.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main({
    baselinePath: ".claude/config/admin-ui-debt-baseline.json",
    scriptPath: ".claude/scripts/admin-ui/check-admin-ui-debt.mjs",
    rulePath: ".claude/rules/admin-ui.md",
  });
}
