#!/usr/bin/env node
/**
 * report — candidates.json + health.json から週次 digest を生成する。
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md
 * （順序: blocker → verified → top opp → mobile → CWV → coverage → freshness → 判定対象）。
 *   node .claude/scripts/search-growth/report.mjs [--limit N] [--json]
 */
import { PATHS, readJson, getArg, hasFlag } from "./lib/state.mjs";
import { pathToFileURL } from "node:url";

const BLOCKER_TYPES = new Set(["server-risk", "indexability-conflict", "soft-404-risk", "canonical-drift"]);
const OPPORTUNITY_TYPES = new Set(["ctr-opportunity", "striking-distance", "query-gap"]);

export function buildReport(candidates, health, limit = 10) {
  const pending = candidates.filter((c) => c.status === "pending");
  const pick = (pred) => pending.filter(pred).slice(0, limit);
  return {
    blockers: pick((c) => BLOCKER_TYPES.has(c.type)),
    verifiedChanges: candidates.filter((c) => c.status === "measured"),
    topOpportunities: pick((c) => OPPORTUNITY_TYPES.has(c.type)),
    mobileGaps: pick((c) => c.type === "mobile-gap"),
    cwv: pick((c) => c.type === "cwv-opportunity" || c.type === "lab-regression"),
    coverage: pick((c) => c.type === "crawled-not-indexed" || c.type === "measurement-gap"),
    freshness: health?.sources ?? {},
  };
}

function line(c) {
  return `  [${c.type}] ${c.url}  score=${c.score}  fresh=${c.freshness}  → ${c.expectedMetric ?? ""}`;
}

function main() {
  const argv = process.argv.slice(2);
  const limit = Number(getArg(argv, "--limit", "10"));
  const cand = readJson(PATHS.candidates);
  const health = readJson(PATHS.health);
  if (!cand) {
    console.error("[report] candidates.json が無い。先に analyze を実行してください。");
    process.exit(1);
  }
  const r = buildReport(cand.candidates, health, limit);
  if (hasFlag(argv, "--json")) {
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  const out = [];
  out.push(`# 検索成長ダイジェスト — ${cand.week} (${cand.generatedAt})`);
  out.push(`候補 ${cand.count} 件 / by type: ${JSON.stringify(cand.byType)}`);
  out.push("");
  out.push("## 1. blocker (5xx / sitemap conflict / thin 200 / canonical drift)");
  out.push(r.blockers.length ? r.blockers.map(line).join("\n") : "  (なし)");
  out.push("## 2. verified changes (measured)");
  out.push(r.verifiedChanges.length ? r.verifiedChanges.map(line).join("\n") : "  (なし)");
  out.push("## 3. top opportunities (CTR / striking distance / query gap)");
  out.push(r.topOpportunities.length ? r.topOpportunities.map(line).join("\n") : "  (なし)");
  out.push("## 4. mobile gaps");
  out.push(r.mobileGaps.length ? r.mobileGaps.map(line).join("\n") : "  (なし・page×device slice は live fetch が必要)");
  out.push("## 5. CWV (field / lab)");
  out.push(r.cwv.length ? r.cwv.map(line).join("\n") : "  (なし)");
  out.push("## 6. coverage (crawled-not-indexed / measurement-gap)");
  out.push(r.coverage.length ? r.coverage.map(line).join("\n") : "  (なし)");
  out.push("## 7. data freshness / limitations");
  for (const [k, v] of Object.entries(r.freshness)) {
    out.push(`  ${k}: ${v.status} freshness=${v.freshness} count=${v.count} observedAt=${v.observedAt ?? "-"}`);
  }
  out.push("## 8. 判定対象 (14 / 28 / 56 日後)");
  out.push("  各候補の suggestedVerification に従い、実装後 14/28/56 日で再計測 (evidence-based-judgment)。");
  out.push("  自動 issue は PSI/Cloudflare 閾値 alert のみ。一般候補は人間承認後に .claude/todo/improvements.md へ。");
  console.log(out.join("\n"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
