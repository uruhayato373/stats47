#!/usr/bin/env node
/**
 * cli — search-growth の 1 入口 (status / next / measure は service を直接呼ぶ)。
 * collect/normalize/analyze/report は各スクリプトへ委譲する。
 *
 * 正典: docs/02_実装計画/39 §7 / §14。MCP が無くても CLI で全機能が成立する。
 *
 *   node .claude/scripts/search-growth/cli.mjs <status|next|measure|collect|normalize|analyze|report|all> [opts]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { status, next, measure } from "./lib/service.mjs";
import { getArg, hasFlag } from "./lib/state.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const cmd = argv[0];

function runScript(file, extra = []) {
  const r = spawnSync("node", [path.join(__dirname, file), ...extra], { stdio: "inherit" });
  process.exit(r.status ?? 0);
}

function printJsonOr(fn, humanize) {
  const out = fn();
  if (hasFlag(argv, "--json")) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    humanize(out);
  }
}

switch (cmd) {
  case "collect":
    runScript("collect.mjs", argv.slice(1));
    break;
  case "normalize":
    runScript("normalize.mjs", argv.slice(1));
    break;
  case "analyze":
    runScript("analyze.mjs", argv.slice(1));
    break;
  case "report":
    runScript("report.mjs", argv.slice(1));
    break;
  case "all": {
    for (const f of ["collect.mjs", "normalize.mjs", "analyze.mjs", "report.mjs"]) {
      const r = spawnSync("node", [path.join(__dirname, f), ...argv.slice(1)], { stdio: "inherit" });
      if (r.status && f !== "report.mjs") { /* collect の partial 由来 exit1 は継続 */ }
    }
    break;
  }
  case "status":
    printJsonOr(status, (s) => {
      console.log(`# search-growth status (${s.generatedAt ?? "未生成"})`);
      console.log(`observations=${s.totalObservations}  candidates=${s.candidateCount}`);
      console.log(`by type: ${JSON.stringify(s.candidatesByType)}`);
      console.log("sources:");
      for (const [k, v] of Object.entries(s.sources ?? {})) {
        console.log(`  ${k.padEnd(11)} ${v.status.padEnd(8)} freshness=${v.freshness} count=${v.count} observedAt=${v.observedAt ?? "-"}`);
      }
      if (s.stale.length) console.log(`⚠️  stale/missing sources: ${s.stale.join(", ")}`);
    });
    break;
  case "next":
    printJsonOr(() => next({ limit: Number(getArg(argv, "--limit", "20")) }), (r) => {
      console.log(`# 次の候補 (top ${r.items.length} / pending ${r.total})`);
      for (const c of r.items) {
        console.log(`  [${c.type}] ${c.url}  score=${c.score}  fresh=${c.freshness}`);
        console.log(`      → ${c.expectedMetric ?? ""}  (${c.suggestedVerification ?? ""})`);
      }
      if (r.nextCursor) console.log(`  ... more (cursor=${r.nextCursor})`);
    });
    break;
  case "measure":
    printJsonOr(() => measure({ candidateId: getArg(argv, "--candidate") }), (m) => {
      if (m.error) { console.error(`[measure] ${m.error}`); process.exit(1); }
      console.log(`# measure ${m.id}`);
      console.log(`type=${m.type} url=${m.url} score=${m.score} status=${m.status}`);
      console.log(`expected: ${m.expectedMetric}`);
      console.log(`verify: ${m.suggestedVerification}`);
      console.log(`evidence:`);
      for (const e of m.evidence) console.log(`  ${e.source}:${e.metric}=${e.value} (${e.freshness})`);
      console.log(`baseline: ${JSON.stringify(m.baselinePeriod)}`);
      console.log(`判定スケジュール: 14日=${m.judgmentSchedule.day14} / 28日=${m.judgmentSchedule.day28} / 56日=${m.judgmentSchedule.day56}`);
      if (m.limitations?.length) console.log(`limitations: ${m.limitations.join(" / ")}`);
    });
    break;
  default:
    console.log("usage: cli.mjs <status|next|measure|collect|normalize|analyze|report|all> [--json] [--limit N] [--candidate ID]");
    process.exit(cmd ? 1 : 0);
}
