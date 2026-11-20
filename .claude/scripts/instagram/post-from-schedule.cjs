#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/sns/instagram-post-from-schedule.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
require("../../../packages/ops/src/sns/instagram-post-from-schedule.cjs").main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exit(1);
});
