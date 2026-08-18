#!/usr/bin/env node
/**
 * cli — search-growth の 1 入口 (status / next / measure は service を直接呼ぶ)。
 * collect/normalize/analyze/report は各スクリプトへ委譲する。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * MCP が無くても CLI で全機能が成立する。
 *
 *   node .claude/scripts/search-growth/cli.mjs <status|next|measure|collect|normalize|analyze|report|all> [opts]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { status, next, measure } from "./lib/service.mjs";
import { selectTriage, applyApproval, applyDismiss, WEEKLY_APPROVAL_MAX } from "./lib/triage.mjs";
import { PATHS, readJson, writeJson, getArg, hasFlag } from "./lib/state.mjs";

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
  case "triage":
    // 週次レビュー用の最大 3 件 (technical/content/measurement 各 1)。read-only。
    printJsonOr(() => {
      const doc = readJson(PATHS.candidates) ?? { candidates: [] };
      return selectTriage(doc.candidates ?? []);
    }, (t) => {
      console.log(`# 週次トリアージ (最大 3 件・区分各 1)`);
      console.log(`WIP: ${t.wip}/${t.wipLimit}${t.wipBlocked ? " ⚠️ 上限到達 — 新規承認不可" : ""}  insufficient除外: ${t.excluded.insufficient}`);
      for (const c of t.shortlist) {
        console.log(`  [${c.category}] ${c.type} ${c.url}  score=${c.score}  fresh=${c.freshness}`);
        console.log(`      期間: ${JSON.stringify(c.baselinePeriod)}  期待: ${c.expectedMetric ?? "-"}`);
        for (const e of c.evidence ?? []) console.log(`      evidence ${e.source}:${e.metric}=${e.value} (${e.freshness})`);
        if (c.limitations?.length) console.log(`      limitations: ${c.limitations.join(" / ")}`);
        console.log(`      承認: npm run search-growth:approve -- --candidate ${c.id}`);
      }
      if (!t.shortlist.length) console.log("  (pending 候補なし)");
      console.log(`承認は人間判断。上限 ${WEEKLY_APPROVAL_MAX} 件/週・改善バックログへの追加も承認後`);
    });
    break;
  case "approve": {
    // 人間承認 (pending→approved)。WIP≤5 / 週2件を機械強制する。repo state のみ書く (外部 mutation なし)。
    const id = getArg(argv, "--candidate");
    if (!id) { console.error("usage: cli.mjs approve --candidate <ID>"); process.exit(1); }
    const doc = readJson(PATHS.candidates);
    if (!doc) { console.error("[approve] candidates.json が無い"); process.exit(1); }
    try {
      const { candidates, approved } = applyApproval(doc.candidates ?? [], id);
      writeJson(PATHS.candidates, { ...doc, candidates });
      console.log(`[approve] ✓ ${approved.id} (week=${approved.approvedWeek})`);
      console.log(`次: 実装 → 14/28/56 日で npm run search-growth:measure -- --candidate ${approved.id}`);
      console.log("承認済み施策は .claude/todo/improvements.md へ手動で記録する (自動追加しない)");
    } catch (e) {
      console.error(`[approve] ✗ ${e.message}`);
      process.exit(1);
    }
    break;
  }
  case "dismiss": {
    const id = getArg(argv, "--candidate");
    if (!id) { console.error("usage: cli.mjs dismiss --candidate <ID> [--reason \"...\"]"); process.exit(1); }
    const doc = readJson(PATHS.candidates);
    if (!doc) { console.error("[dismiss] candidates.json が無い"); process.exit(1); }
    try {
      const { candidates, dismissed } = applyDismiss(doc.candidates ?? [], id, { reason: getArg(argv, "--reason") });
      writeJson(PATHS.candidates, { ...doc, candidates });
      console.log(`[dismiss] ✓ ${dismissed.id}${dismissed.dismissReason ? ` (${dismissed.dismissReason})` : ""}`);
    } catch (e) {
      console.error(`[dismiss] ✗ ${e.message}`);
      process.exit(1);
    }
    break;
  }
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
    console.log("usage: cli.mjs <status|next|triage|approve|dismiss|measure|collect|normalize|analyze|report|all> [--json] [--limit N] [--candidate ID] [--reason \"...\"]");
    process.exit(cmd ? 1 : 0);
}
