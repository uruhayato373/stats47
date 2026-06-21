#!/usr/bin/env node
/**
 * build-ai-content-queue.mjs — ranking ai-content 是正キュー (状態付き SSOT) を R2 + GSC から再導出する。
 *
 * blog の build-remediation-queue.mjs と同型の設計思想:
 *   「done か」は手動ログでなく **R2 の ai-content が決定的ゲート auditRow を通る (blocker 0) か** で判定する。
 *   = R2 が真実源、キューは毎回 R2+GSC から再構築する派生ビュー。手動ログのドリフトが起きない。
 *   → どのセッション・どの PC からでも、本スクリプトを実行すれば「今 done な集合 / 次にやるべき集合」が
 *     決定的に分かる。後日途中から再開しても安全 (中断耐性)。
 *
 * 対象スコープ: **GSC 流入のある /ranking/ ページ** (SEO 優先順位の母集団)。impressions 降順で優先。
 *   ※ 流入ゼロの long-tail missing は本キュー対象外 (それは list-pending.ts が全件把握)。SEO 目的では
 *     流入のある incomplete/blocker ページを優先するのが効くため、本キューはそれを管理する。
 *
 * 判定:
 *   - missing      : ai-content.json が R2 に無い → needs-regen
 *   - blocker      : ある が auditRow で blocker>0 (旧プロンプト由来の括弧数値等) → needs-regen
 *   - incomplete   : 4フィールドのいずれか欠落 (auditRow が missing-insights / missing-pref-commentary 等で blocker) → needs-regen
 *   - done         : ある かつ auditRow.ok (blocker 0)
 *   - no-data      : build-input 不能 (観測値 values.json が R2 に無い) は別途検出されるが、ここでは ai-content 有無で分類
 *
 * 出力:
 *   .claude/state/ai-content/remediation-queue.json  (機械可読・per-key status + impressions + reason + checkedAt)
 *   .claude/state/ai-content/LATEST.md               (人間向けサマリ)
 *
 * Usage:
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs            # 再構築 (R2 を全 GSC key 走査)
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10  # 次にやるべき needs-regen 上位10 (impressions順)
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --json     # サマリ JSON
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --no-build --next 10  # 既存キューJSONから --next だけ
 *
 * 関連: audit-ai-content.mjs (auditRow) / build-input.ts / generate-parallel.ts /
 *       docs/02_実装計画/04_機能バックログ.md [AICONTENT-DBLESS-REBUILD]
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { auditRow } from "./audit-ai-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..");
const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const GSC_SNAP_DIR = join(ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
const STATE_DIR = join(ROOT, ".claude/state/ai-content");
const QUEUE_JSON = join(STATE_DIR, "remediation-queue.json");
const LATEST_MD = join(STATE_DIR, "LATEST.md");
const CONCURRENCY = 16;

function latestGscPagesCsv() {
  if (!existsSync(GSC_SNAP_DIR)) return null;
  const weeks = readdirSync(GSC_SNAP_DIR)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .sort()
    .reverse();
  for (const w of weeks) {
    const p = join(GSC_SNAP_DIR, w, "pages.csv");
    if (existsSync(p)) return { week: w, path: p };
  }
  return null;
}

function parseRankingKeysFromGsc(csvPath) {
  const lines = readFileSync(csvPath, "utf8").trim().split("\n");
  const out = new Map(); // key -> {impressions, clicks, position}
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const page = cols[0] ?? "";
    const m = page.match(/\/ranking\/([^/?#]+)/);
    if (!m) continue;
    const key = m[1];
    const clicks = Number(cols[1] ?? 0);
    const impressions = Number(cols[2] ?? 0);
    const position = Number(cols[4] ?? 0);
    const prev = out.get(key);
    // 同一 key が複数行 (末尾スラッシュ違い等) のとき impressions を合算
    if (prev) {
      prev.impressions += impressions;
      prev.clicks += clicks;
    } else {
      out.set(key, { impressions, clicks, position });
    }
  }
  return out;
}

async function fetchAiContent(key) {
  const url = `${R2_PUBLIC}/app/ranking/${encodeURIComponent(key)}/ai-content.json?cb=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (res.status === 404) return { present: false, row: null };
    if (!res.ok) return { present: false, row: null, fetchError: res.status };
    // R2 last-modified を「いつ修正したか」の真実源として取り込む (content の updatedAt より権威がある)
    const lastModified = res.headers.get("last-modified") || null;
    return { present: true, row: await res.json(), lastModified };
  } catch (e) {
    return { present: false, row: null, fetchError: String(e).slice(0, 60) };
  }
}

function classify(key, gsc, fetched) {
  const base = {
    rankingKey: key,
    impressions: gsc.impressions,
    clicks: gsc.clicks,
    position: gsc.position,
  };
  if (!fetched.present) {
    return { ...base, status: "needs-regen", reason: fetched.fetchError ? `fetch-error:${fetched.fetchError}` : "missing", blockers: [] };
  }
  const audit = auditRow(fetched.row);
  if (audit.ok) {
    // lastModified = R2 上で「いつ修正/反映されたか」(ISO でなく HTTP-date)。updatedAt は content 自己申告 (null の場合あり)
    return {
      ...base,
      status: "done",
      reason: "ok",
      blockers: [],
      warns: audit.warns.map((w) => w.code),
      lastModified: fetched.lastModified ?? null,
      updatedAt: fetched.row?.updatedAt ?? null,
    };
  }
  const codes = audit.blockers.map((b) => b.code);
  // incomplete (フィールド欠落) と blocker (内容違反) を reason で区別
  const incompleteCodes = ["missing-insights", "missing-pref-commentary", "faq-parse", "pref-parse", "no-content"];
  const isIncomplete = codes.some((c) => incompleteCodes.includes(c));
  return {
    ...base,
    status: "needs-regen",
    reason: isIncomplete ? "incomplete" : "blocker",
    blockers: codes,
  };
}

async function buildQueue() {
  const gsc = latestGscPagesCsv();
  if (!gsc) throw new Error(`GSC pages.csv が見つかりません (${GSC_SNAP_DIR})`);
  const keyMap = parseRankingKeysFromGsc(gsc.path);
  const keys = [...keyMap.keys()];
  process.stderr.write(`[build-queue] GSC ${gsc.week}: /ranking/ key ${keys.length} 件を R2 で判定中…\n`);

  const entries = [];
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (k) => classify(k, keyMap.get(k), await fetchAiContent(k))),
    );
    entries.push(...results);
  }
  entries.sort((a, b) => b.impressions - a.impressions);

  const done = entries.filter((e) => e.status === "done");
  const needs = entries.filter((e) => e.status === "needs-regen");
  const byReason = needs.reduce((acc, e) => ((acc[e.reason] = (acc[e.reason] ?? 0) + 1), acc), {});

  const queue = {
    generatedAt: new Date().toISOString(),
    gscSnapshot: gsc.week,
    scope: "GSC流入のある /ranking/ ページ (SEO優先母集団)",
    doneCriteria: "R2 の ai-content が auditRow を通る (blocker 0)",
    summary: {
      total: entries.length,
      done: done.length,
      needsRegen: needs.length,
      needsByReason: byReason,
      doneImpressions: done.reduce((s, e) => s + e.impressions, 0),
      needsImpressions: needs.reduce((s, e) => s + e.impressions, 0),
    },
    entries,
  };

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(QUEUE_JSON, JSON.stringify(queue, null, 2) + "\n");
  writeLatestMd(queue);
  return queue;
}

function writeLatestMd(queue) {
  const s = queue.summary;
  const top = queue.entries.filter((e) => e.status === "needs-regen").slice(0, 20);
  // done を「いつ修正したか」(R2 last-modified) 降順に。新しく直したものが上。
  const recentDone = queue.entries
    .filter((e) => e.status === "done" && e.lastModified)
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    .slice(0, 15);
  const lines = [
    `# ranking ai-content 是正キュー (LATEST)`,
    ``,
    `- 生成: ${queue.generatedAt}`,
    `- GSC snapshot: ${queue.gscSnapshot} / スコープ: ${queue.scope}`,
    `- done 判定: ${queue.doneCriteria}`,
    ``,
    `## サマリ (GSC流入 /ranking/ ページ ${s.total} 件)`,
    ``,
    `- ✅ done: ${s.done} 件 (impressions 計 ${s.doneImpressions})`,
    `- ⏳ needs-regen: ${s.needsRegen} 件 (impressions 計 ${s.needsImpressions})`,
    `  - 内訳: ${Object.entries(s.needsByReason).map(([k, v]) => `${k} ${v}`).join(" / ") || "—"}`,
    ``,
    `## いつ修正したか (done を R2 last-modified 降順・上位15)`,
    ``,
    `| R2 last-modified | key | impressions |`,
    `|---|---|---|`,
    ...recentDone.map((e) => `| ${e.lastModified} | ${e.rankingKey} | ${e.impressions} |`),
    ``,
    `## 次にやるべき上位20 (impressions 降順)`,
    ``,
    `| impressions | key | reason | blockers |`,
    `|---|---|---|---|`,
    ...top.map((e) => `| ${e.impressions} | ${e.rankingKey} | ${e.reason} | ${(e.blockers || []).join(",") || "-"} |`),
    ``,
    `> 次バッチ: \`node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10\` で対象 key を取得 →`,
    `> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。`,
  ];
  writeFileSync(LATEST_MD, lines.join("\n") + "\n");
}

function loadQueue() {
  if (!existsSync(QUEUE_JSON)) throw new Error(`キューが未生成。先に --no-build 無しで実行してください: ${QUEUE_JSON}`);
  return JSON.parse(readFileSync(QUEUE_JSON, "utf8"));
}

async function main() {
  const argv = process.argv.slice(2);
  const noBuild = argv.includes("--no-build");
  const asJson = argv.includes("--json");
  const nextIdx = argv.indexOf("--next");
  const nextN = nextIdx >= 0 ? Number(argv[nextIdx + 1]) : null;

  const queue = noBuild ? loadQueue() : await buildQueue();

  if (nextN != null) {
    const next = queue.entries.filter((e) => e.status === "needs-regen").slice(0, nextN);
    if (asJson) {
      process.stdout.write(JSON.stringify(next, null, 2) + "\n");
    } else {
      for (const e of next) process.stdout.write(`${e.rankingKey}\n`);
      process.stderr.write(`\n[next ${nextN}] needs-regen ${queue.summary.needsRegen} 件中 上位 ${next.length} (impressions ${next[0]?.impressions ?? 0}〜${next[next.length - 1]?.impressions ?? 0})\n`);
    }
    return;
  }

  if (asJson) {
    process.stdout.write(JSON.stringify(queue.summary, null, 2) + "\n");
  } else {
    const s = queue.summary;
    process.stdout.write(
      `=== ranking ai-content 是正キュー (GSC ${queue.gscSnapshot}) ===\n` +
        `総 ${s.total} / ✅done ${s.done} / ⏳needs-regen ${s.needsRegen}\n` +
        `needs 内訳: ${Object.entries(s.needsByReason).map(([k, v]) => `${k} ${v}`).join(" / ") || "—"}\n` +
        `→ ${QUEUE_JSON}\n→ ${LATEST_MD}\n`,
    );
  }
}

main().catch((e) => {
  process.stderr.write(`[build-ai-content-queue] ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
