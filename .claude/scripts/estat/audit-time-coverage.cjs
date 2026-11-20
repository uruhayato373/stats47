#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/estat/audit-time-coverage.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
require("../../../packages/ops/src/estat/audit-time-coverage.cjs").main().catch((error) => { console.error(error.message); process.exitCode = 1; });
