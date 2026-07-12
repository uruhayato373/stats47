#!/usr/bin/env node
/**
 * measure-gsc-impact.mjs — ブログ是正 wave の GSC 効果計測 (wave_id 駆動)
 *
 * 是正ループ ④ の自動化 (.claude/rules/blog-remediation-loop.md)。
 * `.claude/state/blog/auto-brushup-history.json` の wave_id を真実源に、
 * due (是正から min-weeks 以上経過) に達した各 wave の before/after を週次 GSC snapshot で
 * 自動 diff し、`improvement-log.md` の `## [BLOG-WAVE-<wave_id>]` section を upsert する。
 *
 * 旧版 (BLOG-CTR-02 ハードコード + 手動 before/after 指定) は廃止。
 *
 * Usage:
 *   node .claude/scripts/blog/measure-gsc-impact.mjs                 # due な全 wave を計測
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-05-25-auto   # 指定 wave のみ (due 無視)
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --min-weeks 4   # 是正後 4 週以上経過した wave のみ
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --after 2026-W23  # after 週を固定
 *   node .claude/scripts/blog/measure-gsc-impact.mjs --dry-run        # ログ書き込みせず stdout のみ
 *
 * 入力:
 *   - .claude/state/blog/auto-brushup-history.json   (wave_id → slug + date)
 *   - .claude/skills/analytics/gsc-improvement/reference/snapshots/<YYYY-Www>/pages.csv
 * 出力:
 *   - .claude/skills/analytics/gsc-improvement/reference/improvement-log.md (section upsert)
 *
 * 判定は evidence-based-judgment.md 準拠で effect/pending 据え置き (delta を提示するだけ)。
 * effect/full|partial の確定は人間 (weekly-review) が最低 2-4 週連続観測してから。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const SNAPSHOT_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);
const LOG_PATH = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/improvement-log.md",
);
const HISTORY_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/blog/auto-brushup-history.json",
);

// ====== 引数 ======
const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);

const onlyWave = getArg("--wave", null);
const minWeeks = parseInt(getArg("--min-weeks", "2"), 10);
const afterOverride = getArg("--after", null);
const dryRun = hasFlag("--dry-run");

// ====== ISO 週ユーティリティ ======
// snapshot フォルダ名は ISO-8601 週 (YYYY-Www, 月曜始まり)。
function isoWeekOf(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // 木曜に寄せる
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
// ISO 週文字列は YYYY-Www 固定幅なので辞書順 = 時系列順。
function weekLt(a, b) {
  return a < b;
}
// 2 つの ISO 週のおおよその週数差 (after - before)。同年・隣接年で十分な近似。
function weekDiff(before, after) {
  const [by, bw] = before.split("-W").map(Number);
  const [ay, aw] = after.split("-W").map(Number);
  return (ay - by) * 52 + (aw - bw);
}

// ====== 利用可能 snapshot 週 ======
const availableWeeks = fs.existsSync(SNAPSHOT_DIR)
  ? fs
      .readdirSync(SNAPSHOT_DIR)
      .filter((d) => /^\d{4}-W\d{2}$/.test(d))
      .filter((d) => fs.existsSync(path.join(SNAPSHOT_DIR, d, "pages.csv")))
      .sort()
  : [];

if (availableWeeks.length === 0) {
  console.error(`[error] GSC snapshot 週が無い: ${SNAPSHOT_DIR}`);
  process.exit(1);
}
const latestWeek = afterOverride || availableWeeks[availableWeeks.length - 1];

// ====== pages.csv 読み込み (slug 集計) ======
const pagesCache = new Map();
function loadPages(week) {
  if (pagesCache.has(week)) return pagesCache.get(week);
  const p = path.join(SNAPSHOT_DIR, week, "pages.csv");
  if (!fs.existsSync(p)) {
    pagesCache.set(week, []);
    return [];
  }
  const lines = fs.readFileSync(p, "utf8").trim().split("\n").slice(1);
  const rows = lines.map((l) => {
    const parts = l.split(",");
    const position = parseFloat(parts[parts.length - 1]);
    const ctr = parseFloat(parts[parts.length - 2]);
    const impressions = parseInt(parts[parts.length - 3], 10);
    const clicks = parseInt(parts[parts.length - 4], 10);
    const page = parts
      .slice(0, parts.length - 4)
      .join(",")
      .replace(/^"|"$/g, "");
    return { page, clicks, impressions, ctr, position };
  });
  pagesCache.set(week, rows);
  return rows;
}

function aggregateBySlug(rows, slug) {
  const matched = rows.filter((r) => r.page.includes(`/blog/${slug}`));
  const impressions = matched.reduce((s, r) => s + r.impressions, 0);
  const clicks = matched.reduce((s, r) => s + r.clicks, 0);
  const weightedPos = matched.reduce((s, r) => s + r.position * r.impressions, 0);
  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPos / impressions : 0,
  };
}

// ====== wave → slugs + date を history から構築 ======
if (!fs.existsSync(HISTORY_PATH)) {
  console.error(`[error] brushup 履歴が無い: ${HISTORY_PATH}`);
  process.exit(1);
}
const history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
const waves = new Map(); // wave_id → { date, slugs:Set }
for (const e of history.entries || []) {
  if (!e.wave_id || !e.slug) continue;
  if (!waves.has(e.wave_id)) waves.set(e.wave_id, { date: e.date, slugs: new Set() });
  const w = waves.get(e.wave_id);
  w.slugs.add(e.slug);
  // wave の代表日は最も早い是正日 (before 週決定に使う)
  if (e.date && (!w.date || e.date < w.date)) w.date = e.date;
}

if (waves.size === 0) {
  console.error("[error] wave_id を持つ brushup 履歴が無い");
  process.exit(1);
}

// ====== 各 wave を計測 ======
function diffOf(before, after) {
  return {
    impressions: after.impressions - before.impressions,
    clicks: after.clicks - before.clicks,
    ctrPp: (after.ctr - before.ctr) * 100,
    position: after.position - before.position,
  };
}
const sign = (n, digits = 0) => `${n >= 0 ? "+" : ""}${digits ? n.toFixed(digits) : n}`;

function buildWaveSection(waveId, info) {
  const waveWeek = isoWeekOf(new Date(info.date));
  // before = wave 週より前で最大の利用可能週。
  const beforeCandidates = availableWeeks.filter((w) => weekLt(w, waveWeek));
  const beforeWeek = beforeCandidates.length
    ? beforeCandidates[beforeCandidates.length - 1]
    : availableWeeks[0];
  const afterWeek = latestWeek;
  const elapsed = weekDiff(waveWeek, afterWeek);

  const due = onlyWave ? true : elapsed >= minWeeks;
  if (!due) {
    return { skipped: true, reason: `not due (${elapsed}w < ${minWeeks}w)`, waveWeek, afterWeek };
  }
  if (!weekLt(beforeWeek, afterWeek)) {
    return { skipped: true, reason: "before/after 週が同一", waveWeek, afterWeek };
  }

  const pagesBefore = loadPages(beforeWeek);
  const pagesAfter = loadPages(afterWeek);

  const slugs = [...info.slugs].sort();
  const rows = [];
  let totBefore = { impressions: 0, clicks: 0 };
  let totAfter = { impressions: 0, clicks: 0 };
  for (const slug of slugs) {
    const b = aggregateBySlug(pagesBefore, slug);
    const a = aggregateBySlug(pagesAfter, slug);
    const d = diffOf(b, a);
    totBefore.impressions += b.impressions;
    totBefore.clicks += b.clicks;
    totAfter.impressions += a.impressions;
    totAfter.clicks += a.clicks;
    rows.push({ slug, b, a, d });
  }
  const totCtrBefore = totBefore.impressions > 0 ? totBefore.clicks / totBefore.impressions : 0;
  const totCtrAfter = totAfter.impressions > 0 ? totAfter.clicks / totAfter.impressions : 0;

  let md = `\n## [BLOG-WAVE-${waveId}]\n\n`;
  md += `- **status**: effect/pending (人間が ${minWeeks}-4 週連続観測で確定 / evidence-based-judgment.md)\n`;
  md += `- **wave_id**: ${waveId} / **記事数**: ${slugs.length}\n`;
  md += `- **remediated_at**: ${info.date} (週 ${waveWeek})\n`;
  md += `- **before**: ${beforeWeek} → **after**: ${afterWeek} (経過 ${elapsed} 週)\n`;
  md += `- **計測日**: ${new Date().toISOString().slice(0, 10)} (自動: measure-gsc-impact.mjs)\n\n`;
  md += `| slug | imp (before→after) | clicks | CTR | position |\n`;
  md += `|---|---|---|---|---|\n`;
  for (const r of rows) {
    md += `| \`${r.slug}\` | ${r.b.impressions}→${r.a.impressions} (${sign(r.d.impressions)}) | ${r.b.clicks}→${r.a.clicks} (${sign(r.d.clicks)}) | ${(r.b.ctr * 100).toFixed(1)}%→${(r.a.ctr * 100).toFixed(1)}% (${sign(r.d.ctrPp, 2)}pp) | ${r.b.position.toFixed(1)}→${r.a.position.toFixed(1)} (${sign(r.d.position, 1)}) |\n`;
  }
  const totClicksDelta = totAfter.clicks - totBefore.clicks;
  const totImpDelta = totAfter.impressions - totBefore.impressions;
  md += `\n**wave 合計**: imp ${totBefore.impressions}→${totAfter.impressions} (${sign(totImpDelta)}) / clicks ${totBefore.clicks}→${totAfter.clicks} (${sign(totClicksDelta)}) / CTR ${(totCtrBefore * 100).toFixed(2)}%→${(totCtrAfter * 100).toFixed(2)}% (${sign((totCtrAfter - totCtrBefore) * 100, 2)}pp)\n`;
  md += `\n### 判定\n\n`;
  md += `- **[実測]** clicks ${sign(totClicksDelta)} / imp ${sign(totImpDelta)} (${beforeWeek}→${afterWeek}, ${slugs.length} 記事)\n`;
  md += `- **[判定] effect/pending** — 自動計測は delta 提示まで。最低 ${minWeeks}-4 週連続で正方向なら weekly-review が effect/full|partial を確定する (evidence-based-judgment.md)\n`;
  md += `- **検証コマンド**: \`node .claude/scripts/blog/measure-gsc-impact.mjs --wave ${waveId}\`\n`;

  return {
    skipped: false,
    md,
    summary: { waveId, slugs: slugs.length, beforeWeek, afterWeek, totClicksDelta, totImpDelta },
  };
}

// ====== 実行 ======
const targets = onlyWave
  ? [...waves.entries()].filter(([id]) => id === onlyWave)
  : [...waves.entries()].sort((a, b) => (a[1].date < b[1].date ? -1 : 1));

if (onlyWave && targets.length === 0) {
  console.error(`[error] wave が履歴に無い: ${onlyWave}`);
  process.exit(1);
}

const sections = [];
const measured = [];
const skipped = [];
for (const [waveId, info] of targets) {
  const r = buildWaveSection(waveId, info);
  if (r.skipped) {
    skipped.push({ waveId, ...r });
    continue;
  }
  sections.push({ waveId, md: r.md });
  measured.push(r.summary);
}

// ====== ログ upsert ======
if (!dryRun && sections.length > 0) {
  let log = fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "# GSC 改善ログ\n";
  for (const { waveId, md } of sections) {
    const header = `## [BLOG-WAVE-${waveId}]`;
    if (log.includes(header)) {
      // 既存 section を最新計測で置換 (同 wave の after 週が進むだけ)
      const re = new RegExp(`\\n## \\[BLOG-WAVE-${waveId.replace(/[-/]/g, "\\$&")}\\][\\s\\S]*?(?=\\n## |\\n*$)`);
      log = log.replace(re, md);
    } else {
      // 最初の ## section の前に挿入 (新しい wave を上に積む)
      const idx = log.indexOf("\n## ");
      if (idx >= 0) log = log.slice(0, idx) + md + log.slice(idx);
      else log += md;
    }
  }
  fs.writeFileSync(LOG_PATH, log);
}

// ====== サマリ (stderr) ======
process.stderr.write(`\nブログ是正 wave 効果計測 (after=${latestWeek}, min-weeks=${minWeeks})\n`);
for (const m of measured) {
  process.stderr.write(
    `  ✓ ${m.waveId} | ${m.slugs} 記事 | ${m.beforeWeek}→${m.afterWeek} | clicks ${sign(m.totClicksDelta)} / imp ${sign(m.totImpDelta)}\n`,
  );
}
for (const s of skipped) {
  process.stderr.write(`  – ${s.waveId} skip (${s.reason})\n`);
}
if (sections.length > 0 && !dryRun) {
  process.stderr.write(`\n✓ ${sections.length} wave section を upsert: ${LOG_PATH}\n`);
} else if (dryRun) {
  process.stderr.write(`\n[dry-run] ${sections.length} section を生成 (書き込みなし)\n`);
  for (const { md } of sections) process.stdout.write(md);
} else {
  process.stderr.write(`\ndue な wave なし (--min-weeks ${minWeeks})\n`);
}
