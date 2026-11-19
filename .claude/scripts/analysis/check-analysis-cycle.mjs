#!/usr/bin/env node
// 本体は packages/ops/src/analysis/check-analysis-cycle.mjs。package.json・workflow・台帳が名指しするこのパスは変えない。
import { main } from "../../../packages/ops/src/analysis/check-analysis-cycle.mjs";

main();
