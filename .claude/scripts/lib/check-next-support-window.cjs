#!/usr/bin/env node
"use strict";
// 本体は packages/ops/src/gates/check-next-support-window.cjs。このパスは workflow・スキル・hook が名指しする入口として残す。
require("../../../packages/ops/src/gates/check-next-support-window.cjs").main();
