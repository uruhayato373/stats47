#!/usr/bin/env node
// 入口。本体は packages/ops/src/search-growth/keyword-page.mjs (workflow・npm script・skill がこのパスで起動する)
import { cli } from "../../../packages/ops/src/search-growth/keyword-page.mjs";

cli();
