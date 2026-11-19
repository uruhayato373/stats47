#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/gates/check-money-unit-audit.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
process.env.MONEY_UNIT_AUDIT_BASELINE ??= ".claude/config/money-unit-audit-baseline.json";

require("../../../packages/ops/src/gates/check-money-unit-audit.cjs").main();
