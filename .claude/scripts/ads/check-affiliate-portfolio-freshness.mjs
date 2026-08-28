#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { evaluateAffiliatePortfolioFreshness } from "./lib/affiliate-portfolio-core.mjs";

const pathArgIndex = process.argv.indexOf("--path");
const path = resolve(pathArgIndex >= 0 ? process.argv[pathArgIndex + 1] : ".claude/state/ads/affiliate-portfolio-latest.json");
const state = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
const result = evaluateAffiliatePortfolioFreshness(state, new Date().toISOString());
console.log(`affiliate portfolio freshness: ${result.status} age=${result.ageDays ?? "?"}d`);
if (result.reasons.length > 0) console.log(`reasons: ${result.reasons.join(", ")}`);
if (result.status !== "ready") process.exitCode = 1;
