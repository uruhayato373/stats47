#!/usr/bin/env node
// 入口。本体は packages/ops/src/ads/build-placement-map.mjs (skill・workflow・品質ゲートがこのパスで起動する)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/ads/build-placement-map.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Fatal:", e?.message ?? e);
    process.exit(1);
  });
}
