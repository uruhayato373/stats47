#!/usr/bin/env node
// 入口。本体は packages/ops/src/audit/theme-chart-live-audit.mjs (skill・workflow・品質ゲートがこのパスで起動する)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/audit/theme-chart-live-audit.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({ ruleRef: ".claude/rules/theme-catalog-standards.md" }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
