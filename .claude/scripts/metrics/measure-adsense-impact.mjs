#!/usr/bin/env node
// 入口。本体は packages/ops/src/metrics/measure-adsense-impact.mjs
// 効果判定の verdict と improvement-log の再現コマンドがこのパスを指すので残す (SCRIPTS-TO-PACKAGES-02)
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../../../packages/ops/src/metrics/measure-adsense-impact.mjs";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
