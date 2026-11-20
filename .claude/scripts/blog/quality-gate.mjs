#!/usr/bin/env node
// 本体は packages/ops/src/blog/quality-gate.mjs。workflow・スキル・agent・hook が名指しするこのパスは変えない。
import { main } from "../../../packages/ops/src/blog/quality-gate.mjs";

main();
