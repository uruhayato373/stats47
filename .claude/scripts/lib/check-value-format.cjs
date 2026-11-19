#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/gates/check-value-format.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
const path = require("node:path");

const ROOT = process.env.STATS47_SCAN_ROOT || path.resolve(__dirname, "..", "..", "..");
process.env.VALUE_FORMAT_BASELINE ??= path.join(ROOT, ".claude/config/value-format-baseline.json");

require("../../../packages/ops/src/gates/check-value-format.cjs").main();
