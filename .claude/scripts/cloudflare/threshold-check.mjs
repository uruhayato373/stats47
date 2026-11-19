#!/usr/bin/env node
// 本体は packages/ops/src/cloudflare/threshold-check.mjs。このパスは workflow・スキル・hook が名指しする入口として残す。
import { main } from "../../../packages/ops/src/cloudflare/threshold-check.mjs";

main();
