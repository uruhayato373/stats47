#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/gates/check-route-contract.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
process.env.ROUTE_CONTRACT_BASELINE ??= ".claude/config/route-contract-baseline.json";

require("../../../packages/ops/src/gates/check-route-contract.cjs");
