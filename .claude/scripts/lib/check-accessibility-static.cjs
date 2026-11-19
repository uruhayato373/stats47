#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/gates/check-accessibility-static.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
process.env.ACCESSIBILITY_BASELINE ??= ".claude/config/accessibility-baseline.json";

require("../../../packages/ops/src/gates/check-accessibility-static.cjs");
