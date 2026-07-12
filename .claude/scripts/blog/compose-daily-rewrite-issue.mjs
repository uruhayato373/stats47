#!/usr/bin/env node
/**
 * compose-daily-rewrite-issue.mjs — 「今日リライトすべきブログ記事」の Issue 本文を生成する。
 *
 * 是正ループの日次運用 (Claude Pro セッションで agent がリライトする運用) の入口。
 * remediation-queue.json の pending 上位 N 件を読み、毎朝の GitHub Issue 本文 (markdown) を stdout へ出す。
 * Claude を CI で動かさない (決定的・コストゼロ)。実リライトは人間が Pro プランのセッションで
 * `/brushup-blog --target queue --next N` を回して行う。
 *
 * Usage:
 *   node .claude/scripts/blog/compose-daily-rewrite-issue.mjs [--next 10]
 *
 * 出力: markdown (stdout)。pending が無い場合は先頭行に `skip:` を出して終了 (workflow が Issue 化をスキップ)。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const QUEUE_PATH = path.join(PROJECT_ROOT, ".claude/state/blog/remediation-queue.json");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const N = parseInt(getArg("--next", "10"), 10);

if (!fs.existsSync(QUEUE_PATH)) {
  process.stdout.write("skip: remediation-queue.json が無い (先に build-remediation-queue.mjs)\n");
  process.exit(0);
}

const q = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
const pending = (q.queue || []).filter((e) => e.status === "pending");
if (pending.length === 0) {
  process.stdout.write("skip: pending 0 件 (是正キューは空)\n");
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const top = pending.slice(0, N);
const s = q.summary || {};

const lines = [];
lines.push(`# 📝 今日のブログ是正リライト ${today}`);
lines.push("");
lines.push(
  `是正キュー (GSC流入 × 品質blocker の統合スコア) の **pending 上位 ${top.length} 件**。` +
    `Claude セッションで下のコマンドを回すと article-writer がリライト → blog-critic PASS → 公開まで実行します。`,
);
lines.push("");
lines.push("```");
lines.push(`/brushup-blog --target queue --next ${N}`);
lines.push("```");
lines.push("");
lines.push(`**残 pending: ${s.pending ?? pending.length} 件** (must-fix ${s.mustFixPending ?? "?"} / opportunity ${s.opportunityPending ?? "?"}) — GSC週: ${q.gscWeek || "?"}`);
lines.push("");
lines.push("| # | slug | lane | lift/月 | imp | blocker/warn | 主因 |");
lines.push("|---|---|---|---|---|---|---|");
top.forEach((e, i) => {
  const flag =
    (e.quality?.flags || [])
      .filter((f) => typeof f === "string" && f.startsWith("blocker"))
      .map((f) => f.replace(/^blocker:\s*/, ""))
      .slice(0, 1)
      .join("") || "—";
  lines.push(
    `| ${i + 1} | \`${e.slug}\` | ${e.lane} | ${e.gsc?.expectedLift ?? 0} | ${e.gsc?.impressions ?? 0} | B${e.quality?.blockers ?? 0}/W${e.quality?.warnings ?? 0} | ${flag} |`,
  );
});
lines.push("");
lines.push("---");
lines.push(
  "_運用: 是正は Claude セッション (Pro) で実行。critic PASS したものだけ公開され、REVISE はドラフト保留。" +
    "効果は次の週次 GSC で `measure-gsc-impact.mjs` が自動計測。正典: " +
    "[.claude/rules/blog-remediation-loop.md](../blob/develop/.claude/rules/blog-remediation-loop.md)_",
);
lines.push("");
lines.push("_Auto-generated daily by `.github/workflows/blog-remediation-daily.yml`_");

process.stdout.write(lines.join("\n") + "\n");
