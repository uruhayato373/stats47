#!/usr/bin/env node
// 入口。本体は packages/ops/src/blog/drop-outdated-outbox-charts.mjs (skill・workflow・品質ゲートがこのパスで起動する)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/blog/drop-outdated-outbox-charts.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
