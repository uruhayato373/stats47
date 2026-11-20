#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/gates/check-asset-policy.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
const path = require("node:path");

const ROOT = process.env.STATS47_SCAN_ROOT || path.resolve(__dirname, "..", "..", "..");
process.env.ASSET_POLICY_BASELINE ??= path.join(ROOT, ".claude/config/asset-policy-baseline.json");
process.env.ASSET_POLICY_EXTRA_DIRS ??= ".claude";

require("../../../packages/ops/src/gates/check-asset-policy.cjs").main().catch((error) => { console.error(error); process.exitCode = 1; });
