#!/usr/bin/env node
// 本体は packages/ops/src/gates/check-image-generation-routes.mjs。このパスは workflow・スキル・hook が名指しする入口として残す。
import { main } from "../../../packages/ops/src/gates/check-image-generation-routes.mjs";

main();
