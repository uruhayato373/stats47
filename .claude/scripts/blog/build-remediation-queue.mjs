#!/usr/bin/env node
/**
 * build-remediation-queue.mjs — ブログ品質「是正キュー」を構築/更新する単一の頭脳。
 *
 * 既存の機構を閉ループに配線するための統合スコアラ。3 つの断線を埋める:
 *   ① 棚卸し ↔ 候補選定: audit-published-blog (品質 blocker) と GSC (expectedLift) を統合
 *   ② キューの状態喪失: 状態 (pending/in-progress/done) を upsert で保持 (毎回上書きしない)
 *   ③ 効果計測: wave_id / remediated_at を持ち、後段の効果計測に繋げる
 *
 * 優先度 = 統合スコア + must-fix レーン (ユーザー選択 2026-06-06):
 *   - lane "must-fix":   publish-blocker (blockers>0) を持つ記事 → 最上位レーン。
 *                        レーン内は combinedScore (GSC 流入 × 品質 severity) で序列化。
 *   - lane "opportunity": blocker 無しだが CTR 改善余地 (expectedLift>0) がある記事 → 次レーン。
 *   - clean (blocker 無し・改善余地無し) はキューに入れない。
 *
 * 真実源: .claude/state/blog/remediation-queue.json (git tracked, 状態を保持)
 *
 * Usage:
 *   # 構築/更新 (audit を fresh 取得 → GSC とマージ → 状態を保ったまま upsert)
 *   node .claude/scripts/blog/build-remediation-queue.mjs
 *   node .claude/scripts/blog/build-remediation-queue.mjs --audit /tmp/published-blog-audit.json  # audit 再利用
 *   node .claude/scripts/blog/build-remediation-queue.mjs --week 2026-W23                          # GSC 週指定
 *
 *   # 状態更新 (brushup スキルが呼ぶ)
 *   node .claude/scripts/blog/build-remediation-queue.mjs --mark-in-progress <slug>
 *   node .claude/scripts/blog/build-remediation-queue.mjs --mark-done <slug> --wave-id 2026-06-08-manual
 *
 *   # 次にやる pending を N 件出す (brushup --target queue が読む)
 *   node .claude/scripts/blog/build-remediation-queue.mjs --next 5            # JSONL (pending 上位 N)
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);

const QUEUE_PATH = path.join(PROJECT_ROOT, ".claude/state/blog/remediation-queue.json");
const HISTORY_PATH = path.join(PROJECT_ROOT, ".claude/state/blog/auto-brushup-history.json");

// CTR 改善余地スコア (select-brushup-candidates.mjs と同じ Backlinko 2023 業界平均 CTR)
const INDUSTRY_AVG_CTR = {
  1: 0.396, 2: 0.187, 3: 0.105, 4: 0.075, 5: 0.053,
  6: 0.041, 7: 0.032, 8: 0.028, 9: 0.025, 10: 0.022,
  11: 0.017, 12: 0.014, 13: 0.013, 14: 0.011, 15: 0.010,
};
function industryAvgCtr(position) {
  const p = Math.round(position);
  if (p in INDUSTRY_AVG_CTR) return INDUSTRY_AVG_CTR[p];
  if (p < 1) return 0.396;
  if (p > 15) return 0.005;
  return 0.01;
}

const DEDUP_DAYS = parseInt(getArg("--dedup-days", "90"), 10);

// ── 状態更新モード (brushup スキルから呼ばれる) ────────────────────────────
function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return null;
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}
function saveQueue(q) {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2) + "\n");
}
function todayStr() {
  // Date.now() は使えるが (CLI なので OK)、日付文字列で十分
  return new Date().toISOString().slice(0, 10);
}

const markInProgress = getArg("--mark-in-progress", null);
const markDone = getArg("--mark-done", null);
if (markInProgress || markDone) {
  const q = loadQueue();
  if (!q) {
    console.error("[error] queue が無い。先に build を実行: node build-remediation-queue.mjs");
    process.exit(1);
  }
  const slug = markInProgress || markDone;
  const entry = q.queue.find((e) => e.slug === slug);
  if (!entry) {
    console.error(`[error] slug がキューに無い: ${slug}`);
    process.exit(1);
  }
  if (markInProgress) {
    entry.status = "in-progress";
    entry.in_progress_at = todayStr();
  } else {
    entry.status = "done";
    entry.remediated_at = todayStr();
    entry.wave_id = getArg("--wave-id", entry.wave_id || null);
  }
  q.summary = summarize(q.queue);
  saveQueue(q);
  console.error(`[ok] ${slug} → ${entry.status}${entry.wave_id ? ` (wave: ${entry.wave_id})` : ""}`);
  process.exit(0);
}

// ── --next モード (pending 上位 N を JSONL で出す) ─────────────────────────
const nextN = getArg("--next", null);
if (nextN) {
  const q = loadQueue();
  if (!q) {
    console.error("[error] queue が無い。先に build を実行");
    process.exit(1);
  }
  const pending = q.queue.filter((e) => e.status === "pending").slice(0, parseInt(nextN, 10));
  for (const e of pending) console.log(JSON.stringify(e));
  if (pending.length === 0) process.exit(2);
  process.exit(0);
}

// ── build モード ─────────────────────────────────────────────────────────
function summarize(queue) {
  const s = { total: queue.length, pending: 0, inProgress: 0, done: 0, mustFixPending: 0, opportunityPending: 0 };
  for (const e of queue) {
    if (e.status === "pending") {
      s.pending++;
      if (e.lane === "must-fix") s.mustFixPending++;
      else s.opportunityPending++;
    } else if (e.status === "in-progress") s.inProgress++;
    else if (e.status === "done") s.done++;
  }
  // 本文の数値が data と食い違う記事数 (2026-08-12 追加)。
  //
  // ★日次 cron の縮小専用ラチェットの入力にする。値照合は誤検出 (実数 ↔ 人口当たりの
  //   取り違え) を潰して公開 426 記事で 0 件になったので、以後は「増えたら本物」として扱える。
  //   艦隊監査をもう一度回さずに済むよう、既にここで読んでいる audit の flags から数える。
  //   正典: `.claude/rules/unit-semantics-standards.md`
  s.valueMismatchArticles = queue.filter((e) =>
    (e.quality?.flags ?? []).some((f) => typeof f === "string" && f.includes("VALUE_MISMATCH")),
  ).length;
  return s;
}

// 1. 品質レーン: audit JSON を取得 (--audit で再利用、無ければ fresh 取得)
let auditPath = getArg("--audit", null);
if (!auditPath) {
  auditPath = "/tmp/published-blog-audit.json";
  process.stderr.write("audit を fresh 取得中 (audit-published-blog.mjs)...\n");
  execFileSync("node", [path.join(__dirname, "audit-published-blog.mjs"), "--json", auditPath], {
    stdio: ["ignore", "ignore", "inherit"],
  });
}
if (!fs.existsSync(auditPath)) {
  console.error(`[error] audit JSON が無い: ${auditPath}`);
  process.exit(1);
}
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const auditBySlug = new Map();
for (const r of audit.results || []) {
  if (r.blockers === -1) continue; // 取得失敗
  auditBySlug.set(r.slug, r);
}

// 2. GSC レーン: 最新 snapshot の pages.csv を読む (無ければ GSC スコア 0 で続行)
function findLatestSnapshot() {
  const dir = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
  if (!fs.existsSync(dir)) return null;
  const weeks = fs.readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d));
  if (!weeks.length) return null;
  weeks.sort().reverse();
  return weeks[0];
}
const week = getArg("--week", findLatestSnapshot());
const gscBySlug = new Map();
if (week) {
  const pagesCsv = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots",
    week,
    "pages.csv",
  );
  if (fs.existsSync(pagesCsv)) {
    const lines = fs.readFileSync(pagesCsv, "utf8").split(/\r?\n/).filter((l) => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < 5) continue;
      if (!cols[0].includes("/blog/")) continue;
      const slug = cols[0].replace(/^https?:\/\/[^/]+\/blog\//, "").replace(/\/$/, "");
      const impressions = parseInt(cols[2], 10) || 0;
      const ctr = parseFloat(cols[3]) || 0;
      const position = parseFloat(cols[4]) || 0;
      const gap = Math.max(0, industryAvgCtr(position) - ctr);
      const expectedLift = Math.round(impressions * gap * 4.3); // 月 clicks 換算
      gscBySlug.set(slug, { impressions, clicks: parseInt(cols[1], 10) || 0, ctr, position, expectedLift });
    }
  }
}

// 3. brushup 履歴 (dedup / done シード)
let history = { entries: [] };
if (fs.existsSync(HISTORY_PATH)) history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
const lastBrushup = new Map(); // slug → { date, wave_id }
const nowMs = Date.now();
for (const e of history.entries || []) {
  const prev = lastBrushup.get(e.slug);
  if (!prev || new Date(e.date) > new Date(prev.date)) lastBrushup.set(e.slug, { date: e.date, wave_id: e.wave_id });
}
const dedupCutoff = nowMs - DEDUP_DAYS * 24 * 60 * 60 * 1000;

// 3.5 勝ちパターン適合度 (analyze-winning-patterns.mjs の出力があれば取り込む)。
// 床(blocker)是正に加え、流入はあるが勝ちプロファイルから外れた記事を opportunity で優先する。
const conformanceBySlug = new Map();
const wpPath = path.join(__dirname, "..", "..", "state", "blog", "winning-patterns.json");
if (fs.existsSync(wpPath)) {
  try {
    const wp = JSON.parse(fs.readFileSync(wpPath, "utf8"));
    for (const c of wp.perArticleConformance || []) conformanceBySlug.set(c.slug, c.conformance);
  } catch {
    /* 壊れていても床ループは動かす */
  }
}

// 4. 全 published 記事を走査して raw entry を作る
const slugs = new Set([...auditBySlug.keys(), ...gscBySlug.keys()]);
const raw = [];
for (const slug of slugs) {
  const a = auditBySlug.get(slug);
  const g = gscBySlug.get(slug) || { impressions: 0, clicks: 0, ctr: 0, position: 0, expectedLift: 0 };
  const blockers = a ? a.blockers : 0;
  const warnings = a ? a.warnings : 0;
  if (!a) continue; // audit に無い記事 (未公開等) は対象外
  const flags = (a.flags || []).map((f) => `${f[0]}: ${f[1]}`);
  const severity = blockers * 3 + warnings; // 品質 severity (生)
  const lane = blockers > 0 ? "must-fix" : g.expectedLift > 0 ? "opportunity" : "clean";
  raw.push({
    slug,
    lane,
    gsc: g,
    quality: {
      blockers,
      warnings,
      prose: a.prose,
      chartCount: a.chartCount ?? a.svg,
      prosePerChart: a.prosePerChart ?? null,
      conformance: conformanceBySlug.has(slug) ? conformanceBySlug.get(slug) : null,
      flags,
    },
    severity,
    lastBrushup: lastBrushup.get(slug) || null,
  });
}

// 5. 正規化して combinedScore を計算
const maxLift = Math.max(1, ...raw.map((r) => r.gsc.expectedLift));
const maxSev = Math.max(1, ...raw.map((r) => r.severity));
for (const r of raw) {
  const gscScore = r.gsc.expectedLift / maxLift; // 0..1
  const qualScore = r.severity / maxSev; // 0..1
  r.combinedScore = Math.round((0.6 * gscScore + 0.4 * qualScore) * 1000) / 1000;
}

// 6. レーン順 (must-fix → opportunity) + レーン内 combinedScore 降順でソート
const LANE_RANK = { "must-fix": 0, opportunity: 1, clean: 2 };
raw.sort((x, y) => {
  if (LANE_RANK[x.lane] !== LANE_RANK[y.lane]) return LANE_RANK[x.lane] - LANE_RANK[y.lane];
  if (y.combinedScore !== x.combinedScore) return y.combinedScore - x.combinedScore;
  if (y.gsc.expectedLift !== x.gsc.expectedLift) return y.gsc.expectedLift - x.gsc.expectedLift;
  // tiebreaker: 勝ちパターン適合度が低い (=改善余地が大きい) ものを先に
  const cx = x.quality.conformance ?? 1;
  const cy = y.quality.conformance ?? 1;
  return cx - cy;
});

// 7. 既存キューの状態を引き継いで upsert
const prev = loadQueue();
const prevBySlug = new Map((prev?.queue || []).map((e) => [e.slug, e]));

const queue = [];
let priority = 0;
for (const r of raw) {
  if (r.lane === "clean") continue; // clean はキューに載せない
  const old = prevBySlug.get(r.slug);
  let status = "pending";
  let wave_id = null;
  let remediated_at = null;
  let in_progress_at = null;

  if (old) {
    if (old.status === "in-progress") {
      status = "in-progress"; // 人が作業中 → 触らない
      in_progress_at = old.in_progress_at || null;
      wave_id = old.wave_id || null;
    } else if (old.status === "done") {
      // 是正済み。audit が今 blocker 0 なら done 維持、まだ blocker があれば再 pending (是正が不十分/退行)
      if (r.quality.blockers === 0) {
        status = "done";
        wave_id = old.wave_id || null;
        remediated_at = old.remediated_at || null;
      } else {
        status = "pending"; // 再 needed
        wave_id = old.wave_id || null; // 過去 wave は履歴として残す
      }
    }
  } else if (r.lastBrushup && new Date(r.lastBrushup.date).getTime() >= dedupCutoff && r.quality.blockers === 0) {
    // 直近 brushup 済 + 今 blocker 無し → done としてシード
    status = "done";
    wave_id = r.lastBrushup.wave_id || null;
    remediated_at = r.lastBrushup.date.slice(0, 10);
  }

  queue.push({
    slug: r.slug,
    lane: r.lane,
    status,
    priority: status === "pending" ? ++priority : null,
    combinedScore: r.combinedScore,
    gsc: r.gsc,
    quality: r.quality,
    wave_id,
    remediated_at,
    in_progress_at,
    last_brushup: r.lastBrushup ? r.lastBrushup.date.slice(0, 10) : null,
  });
}

// 2段 critic の tier 割り当て (ai-content build-ai-content-queue.mjs と同規則):
// **是正対象 (done 以外)** のうち GSC 流入 (impressions) 上位 N 件を opus critic (tier2)、残りは sonnet (tier1)。
// author は常に sonnet (frontmatter 固定)。done を母集団に含めると opus 枠が是正済み記事に消費されるため除外
// (ai-content 側も needs-regen のみを母集団にしている)。
// workflow (blog-mass-rewrite.js) が entry.reviewTier を読んで critic の model を傾斜する。
// 設計正典: .claude/rules/model-prompting.md
const OPUS_REVIEW_TOP_N = 30;
queue
  .filter((e) => e.status !== "done")
  .sort((a, b) => (b.gsc?.impressions || 0) - (a.gsc?.impressions || 0))
  .forEach((e, i) => {
    e.reviewTier = i < OPUS_REVIEW_TOP_N ? "opus" : "sonnet";
  });

const result = {
  generatedAt: new Date().toISOString(),
  gscWeek: week || null,
  auditGeneratedAt: audit.generatedAt || null,
  scoring: "combined = 0.6*norm(GSC expectedLift) + 0.4*norm(blockers*3+warnings); lane: must-fix > opportunity",
  reviewTier: `GSC impressions 上位 ${OPUS_REVIEW_TOP_N} 件 = opus critic (tier2), 他 = sonnet (tier1)`,
  summary: summarize(queue),
  queue,
};
saveQueue(result);

// stderr に人間向けサマリ
const s = result.summary;
process.stderr.write(
  `\n是正キュー更新: ${QUEUE_PATH}\n` +
    `  pending ${s.pending} (must-fix ${s.mustFixPending} / opportunity ${s.opportunityPending}) / in-progress ${s.inProgress} / done ${s.done}\n` +
    `  GSC week: ${week || "なし"} / audit: ${audit.generatedAt?.slice(0, 10) || "?"}\n\n次の 8 件 (pending 上位):\n`,
);
for (const e of queue.filter((e) => e.status === "pending").slice(0, 8)) {
  const flag = e.quality.flags.filter((f) => f.startsWith("blocker")).slice(0, 2).join("; ") || "(blocker なし)";
  process.stderr.write(
    `  #${e.priority} [${e.lane}] ${e.slug} | lift ${e.gsc.expectedLift} imp ${e.gsc.impressions} | B${e.quality.blockers}/W${e.quality.warnings} | ${flag}\n`,
  );
}
