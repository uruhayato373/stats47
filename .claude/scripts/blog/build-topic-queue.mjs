#!/usr/bin/env node
/**
 * build-topic-queue.mjs — 新規ブログ記事「次に何を書くか」の状態付きキューを構築/更新する。
 *
 * remediation-queue (既存記事の是正) の姉妹スクリプト。是正ではなく **新規記事のネタ選定** が責務。
 * 正典: .claude/agents/blog-seo-strategist.md §戦略コンテキスト / 型定義: .claude/rules/blog-quality-standards.md
 *
 * スコア (エフェメラル計算 → 状態付きキュー JSON。永続 DB は作らない):
 *   combined = 0.35*queryGap + 0.25*seasonality + 0.20*surprise + 0.20*competitionGap
 *   - queryGap:       GSC pages.csv の /ranking/<key> imp (専用ブログ記事が無いもの) → norm(log(imp))
 *                     F/G 型は /areas/<code> imp を県別関心の proxy に使う
 *   - seasonality:    data/seasonality-table.json (品目×月)。今月or来月に需要の山があれば 1
 *   - surprise (B型): |r| × カテゴリ距離 (跨ぎ=1 / 同一=0.3)。同語幹ペア (消費量vs支出額等) は除外
 *   - competitionGap: F/G (決算カード/migration-flow)=1.0 / B=0.8 / D2=0.6 / A=0.5
 *
 * lane:
 *   - must-write:   queryGap の生 imp >= MUST_WRITE_IMP (検索需要実証済)
 *   - opportunity:  それ以外
 *
 * 真実源: .claude/state/blog/topic-queue.json (git tracked、status を upsert で保持)
 *
 * Usage:
 *   node .claude/scripts/blog/build-topic-queue.mjs                       # 構築/更新
 *   node .claude/scripts/blog/build-topic-queue.mjs --week 2026-W26       # GSC 週指定
 *   node .claude/scripts/blog/build-topic-queue.mjs --corr-limit 60       # B型の per-key 相関 fetch 上限
 *   node .claude/scripts/blog/build-topic-queue.mjs --next 5              # pending 上位 N を JSONL で
 *   node .claude/scripts/blog/build-topic-queue.mjs --mark-in-progress <topicKey>
 *   node .claude/scripts/blog/build-topic-queue.mjs --mark-done <topicKey> --slug <slug>
 */

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

const QUEUE_PATH = path.join(PROJECT_ROOT, ".claude/state/blog/topic-queue.json");
const SEASONALITY_PATH = path.join(__dirname, "data", "seasonality-table.json");
const METRICS_DIR = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
const PREFS_PATH = path.join(PROJECT_ROOT, "packages/area/src/data/prefectures.json");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const MUST_WRITE_IMP = 300; // 週 imp がこれ以上ある未記事化テーマは must-write
const MIN_GAP_IMP = 50; // gsc-gap 候補の下限 imp
const CORR_MIN_R = 0.6;
const WEIGHTS = { queryGap: 0.35, seasonality: 0.25, surprise: 0.2, competitionGap: 0.2 };
const COMPETITION_GAP = { F: 1.0, G: 1.0, B: 0.8, D2: 0.6, A: 0.5 };
// pending はスコア上位のみ保持 (肥大防止。in-progress/done は無条件保持)。
// 型別上限で B 一色を防ぎ、型ポートフォリオ (blog-seo-strategist.md §戦略コンテキスト) に沿った候補ミックスを保つ
const MAX_PENDING_BY_ARCHETYPE = { B: 60, A: 40, D2: 40, F: 15, G: 15 };
const MAX_PAIRS_PER_BASE = 2; // B型: 同一 base metric からの相関ペアは上位 2 件まで (near-duplicate 防止)
// 倫理的にセンシティブな指標を B型「意外な関係」クリックベイトの軸にしない (ブランド毀損防止)。
// 中絶・自殺・死因等を軽い相関ネタにするのは不適切。metric key の部分一致で B候補から除外する。
// (A/D2/F/G の真面目な単体記事は別途可。ここでは B型の surprise 軸としての利用のみ弾く)
const SENSITIVE_METRIC_PATTERNS = [
  "abortion",
  "suicide",
  "death-rate",
  "death-count",
  "mortality",
  "deaths-",
  "-deaths",
];
const isSensitive = (key) =>
  SENSITIVE_METRIC_PATTERNS.some((p) => key.includes(p));

// ── 状態ヘルパ ──────────────────────────────────────────────────────────────
function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return null;
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}
function saveQueue(q) {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2) + "\n");
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function summarize(queue) {
  const s = { total: queue.length, pending: 0, inProgress: 0, done: 0, mustWritePending: 0, byArchetype: {} };
  for (const e of queue) {
    if (e.status === "pending") {
      s.pending++;
      if (e.lane === "must-write") s.mustWritePending++;
      s.byArchetype[e.archetype] = (s.byArchetype[e.archetype] || 0) + 1;
    } else if (e.status === "in-progress") s.inProgress++;
    else if (e.status === "done") s.done++;
  }
  return s;
}

// ── 状態更新モード ──────────────────────────────────────────────────────────
const markInProgress = getArg("--mark-in-progress", null);
const markDone = getArg("--mark-done", null);
if (markInProgress || markDone) {
  const q = loadQueue();
  if (!q) {
    console.error("[error] queue が無い。先に build を実行: node build-topic-queue.mjs");
    process.exit(1);
  }
  const key = markInProgress || markDone;
  const entry = q.queue.find((e) => e.topicKey === key);
  if (!entry) {
    console.error(`[error] topicKey がキューに無い: ${key}`);
    process.exit(1);
  }
  if (markInProgress) {
    entry.status = "in-progress";
    entry.in_progress_at = todayStr();
  } else {
    entry.status = "done";
    entry.done_at = todayStr();
    entry.published_slug = getArg("--slug", entry.published_slug || null);
  }
  q.summary = summarize(q.queue);
  saveQueue(q);
  console.error(`[ok] ${key} → ${entry.status}${entry.published_slug ? ` (slug: ${entry.published_slug})` : ""}`);
  process.exit(0);
}

// ── --next モード ───────────────────────────────────────────────────────────
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

// ── build モード ────────────────────────────────────────────────────────────

// 1. metric registry (git TS を regex スキャン。tsx 不要の軽量読み)
function loadMetrics() {
  const metrics = new Map();
  for (const file of fs.readdirSync(METRICS_DIR)) {
    if (!file.endsWith(".ts") || file === "index.ts") continue;
    const src = fs.readFileSync(path.join(METRICS_DIR, file), "utf8");
    const key = src.match(/"key":\s*"([^"]+)"/)?.[1];
    if (!key) continue;
    const title = src.match(/"title":\s*"([^"]+)"/)?.[1] || "";
    const category = src.match(/"category":\s*"([^"]+)"/)?.[1] || "";
    const isActive = /"isActive":\s*true/.test(src);
    const isKakei = /"kind":\s*"kakei-chousa"/.test(src);
    metrics.set(key, { key, title, category, isActive, isKakei });
  }
  return metrics;
}

// metric title → 照合用の語幹 (「マヨネーズ・マヨネーズ風調味料消費支出額」→「マヨネーズ」)
function stemOf(title) {
  let s = title.split(/[・（(]/)[0];
  s = s.replace(/(消費支出額|消費量|支出額|購入数量|購入額|生産量|出荷額|保有率|普及率|割合|比率|率|数|額)$/u, "");
  return s.length >= 2 ? s : title.slice(0, 4);
}

// 2. GSC snapshot
function findLatestSnapshot() {
  const dir = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
  if (!fs.existsSync(dir)) return null;
  const weeks = fs.readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d));
  return weeks.sort().reverse()[0] || null;
}
function loadPagesCsv(week) {
  const ranking = new Map(); // key → {imp, clicks, position}
  const areas = new Map(); // prefCode → imp
  if (!week) return { ranking, areas };
  const csv = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots",
    week,
    "pages.csv",
  );
  if (!fs.existsSync(csv)) return { ranking, areas };
  const lines = fs.readFileSync(csv, "utf8").split(/\r?\n/).filter((l) => l.trim());
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 5) continue;
    const url = cols[0];
    const imp = parseInt(cols[2], 10) || 0;
    const m = url.match(/\/ranking\/([a-z0-9-]+)\/?$/);
    if (m) {
      const prev = ranking.get(m[1]);
      ranking.set(m[1], {
        imp: (prev?.imp || 0) + imp,
        clicks: (prev?.clicks || 0) + (parseInt(cols[1], 10) || 0),
        position: parseFloat(cols[4]) || 0,
      });
      continue;
    }
    const a = url.match(/\/areas\/(\d{5})\/?$/);
    if (a) areas.set(a[1], (areas.get(a[1]) || 0) + imp);
  }
  return { ranking, areas };
}

// 3. 公開済み記事 (R2) — 既記事化テーマの dedup
async function loadPublishedArticles() {
  try {
    const res = await fetch(`${R2_BASE}/app/blog/all.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.articles || []).filter((a) => a.published);
  } catch (e) {
    console.error(`[warn] blog all.json 取得失敗 (${e.message}) — dedup なしで続行`);
    return [];
  }
}
function buildCoverageIndex(articles) {
  // 記事 title + tags を連結した検索空間。metric 語幹の部分一致で「既記事化」判定
  return articles.map((a) => ({
    slug: a.slug,
    haystack: [a.title || "", a.seoTitle || "", ...(a.tags || []).map((t) => t.tagKey || "")].join("|"),
  }));
}
function coveredBy(coverage, stem) {
  if (!stem || stem.length < 2) return null;
  const hit = coverage.find((c) => c.haystack.includes(stem));
  return hit ? hit.slug : null;
}

// 4. seasonality
function loadSeasonality() {
  try {
    return JSON.parse(fs.readFileSync(SEASONALITY_PATH, "utf8")).patterns || [];
  } catch {
    return [];
  }
}
function seasonalityScore(patterns, text, nowMonth) {
  const horizon = [nowMonth, (nowMonth % 12) + 1]; // 今月 + 来月 (~8週)
  for (const p of patterns) {
    if (!p.match.some((m) => text.includes(m))) continue;
    if ((p.months || []).some((mo) => horizon.includes(mo))) return { score: 1, label: p.label };
    return { score: 0.3, label: p.label }; // 季節商材だが今は山ではない
  }
  return { score: 0, label: null };
}

// 5. B型: per-key 相関 fetch (GSC imp 上位キーに限定して fetch 数を抑制)
async function fetchCorrelationPairs(keys) {
  const out = [];
  const CONCURRENCY = 8;
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (key) => {
        try {
          const res = await fetch(`${R2_BASE}/app/correlation/by-ranking-key/${key}.json`);
          if (!res.ok) return null;
          return { key, json: await res.json() };
        } catch {
          return null;
        }
      }),
    );
    out.push(...results.filter(Boolean));
  }
  return out;
}

const week = getArg("--week", findLatestSnapshot());
const corrLimit = parseInt(getArg("--corr-limit", "60"), 10);

const metrics = loadMetrics();
const { ranking: gscRanking, areas: gscAreas } = loadPagesCsv(week);
const articles = await loadPublishedArticles();
const coverage = buildCoverageIndex(articles);
const seasonPatterns = loadSeasonality();
const nowMonth = new Date().getMonth() + 1;

console.error(
  `[input] metrics=${metrics.size} / GSC week=${week || "なし"} (ranking pages=${gscRanking.size}, areas=${gscAreas.size}) / published articles=${articles.length}`,
);

const maxRankingImp = Math.max(1, ...[...gscRanking.values()].map((v) => v.imp));
const maxAreaImp = Math.max(1, ...[...gscAreas.values()]);
const normImp = (imp, max) => (imp <= 0 ? 0 : Math.log(1 + imp) / Math.log(1 + max));

const candidates = [];

// ── (a) gsc-gap 候補 (A / D2): ranking ページに検索流入があるのに専用記事が無い ──
for (const [key, g] of gscRanking) {
  if (g.imp < MIN_GAP_IMP) continue;
  const m = metrics.get(key);
  if (!m || !m.isActive) continue;
  const stem = stemOf(m.title);
  const existing = coveredBy(coverage, stem);
  if (existing) continue; // 既記事化 → 是正は remediation-queue の領分
  const archetype = m.isKakei || /(消費|支出|購入)/.test(m.title) ? "D2" : "A";
  const season = seasonalityScore(seasonPatterns, m.title, nowMonth);
  candidates.push({
    topicKey: `gap-${key}`,
    archetype,
    metricKeys: [key],
    label: m.title,
    source: "gsc-gap",
    scores: {
      queryGap: normImp(g.imp, maxRankingImp),
      seasonality: season.score,
      surprise: 0,
      competitionGap: COMPETITION_GAP[archetype],
    },
    evidence: {
      gscImp: g.imp,
      gscClicks: g.clicks,
      gscPosition: g.position,
      seasonLabel: season.label,
      rankingUrl: `/ranking/${key}`,
    },
    suggestedTitle: archetype === "D2" ? `${stem}消費量 日本一はどこ` : `${stem}が多い県はどこ`,
  });
}

// ── (b) correlation 候補 (B): GSC imp 上位キーの per-key top-20 からカテゴリ跨ぎ高相関 ──
const topKeys = [...gscRanking.entries()]
  .filter(([key]) => metrics.get(key)?.isActive)
  .sort((x, y) => y[1].imp - x[1].imp)
  .slice(0, corrLimit)
  .map(([key]) => key);
const corrData = await fetchCorrelationPairs(topKeys);
console.error(`[corr] per-key 相関 fetch: ${corrData.length}/${topKeys.length} 件成功`);

const seenPairs = new Set();
for (const { key: baseKey, json } of corrData) {
  const baseMetric = metrics.get(baseKey);
  if (!baseMetric) continue;
  let pairsFromThisBase = 0;
  // per-key JSON は |r| 降順 top-20。上から見て base あたり MAX_PAIRS_PER_BASE 件で打ち切る
  for (const p of json.pairs || []) {
    if (pairsFromThisBase >= MAX_PAIRS_PER_BASE) break;
    const r = p.pearsonR;
    if (Math.abs(r) < CORR_MIN_R) continue;
    const pairMetric = metrics.get(p.rankingKey);
    if (!pairMetric || !pairMetric.isActive) continue;
    const pairId = [baseKey, p.rankingKey].sort().join("--");
    if (seenPairs.has(pairId)) continue;
    seenPairs.add(pairId);
    // センシティブ指標 (中絶/自殺/死因) を B型「意外な関係」の軸にしない (ブランド毀損防止)
    if (isSensitive(baseKey) || isSensitive(p.rankingKey)) continue;
    const baseStem = stemOf(baseMetric.title);
    const pairStem = stemOf(pairMetric.title);
    if (baseStem === pairStem) continue; // 消費量 vs 支出額 のような自明ペア
    const sameCategory = baseMetric.category === pairMetric.category;
    // 人口統制偏相関が弱い = 「両方とも人口に比例する実数」の見かけ相関 (例 児童数×通勤者数 r=1.00)。
    // B型の主張「意外な関係」が成立しないため大きく減点する。|r|>0.9 の超高相関は
    // ほぼ人口アーティファクトなので、偏相関がよほど強く残らない限り同様に扱う
    const partialR = p.partialRPopulation;
    const populationConfounded =
      (partialR != null && Math.abs(partialR) < 0.45) ||
      (Math.abs(r) > 0.9 && (partialR == null || Math.abs(partialR) < 0.6));
    const surprise = Math.abs(r) * (sameCategory ? 0.3 : 1.0) * (populationConfounded ? 0.2 : 1.0);
    if (surprise < CORR_MIN_R * 0.5) continue; // 同カテゴリ/人口交絡の弱ペアは載せない
    const existing = coveredBy(coverage, baseStem) && coveredBy(coverage, pairStem);
    if (existing) continue;
    const g = gscRanking.get(baseKey) || { imp: 0 };
    const season = seasonalityScore(seasonPatterns, baseMetric.title + pairMetric.title, nowMonth);
    candidates.push({
      topicKey: `corr-${pairId}`,
      archetype: "B",
      metricKeys: [baseKey, p.rankingKey],
      label: `${baseMetric.title} × ${pairMetric.title} (r=${r.toFixed(2)})`,
      source: "correlation",
      scores: {
        queryGap: normImp(g.imp, maxRankingImp),
        seasonality: season.score,
        surprise: Math.round(surprise * 1000) / 1000,
        competitionGap: COMPETITION_GAP.B,
      },
      evidence: {
        pearsonR: Math.round(r * 1000) / 1000,
        partialRPopulation: partialR != null ? Math.round(partialR * 1000) / 1000 : null,
        populationConfounded,
        crossCategory: !sameCategory,
        categories: [baseMetric.category, pairMetric.category],
        gscImp: g.imp,
        rankingUrls: [`/ranking/${baseKey}`, `/ranking/${p.rankingKey}`],
      },
      suggestedTitle: `${baseStem}と${pairStem}の意外な関係`,
    });
    pairsFromThisBase++;
  }
}

// ── (c) F 市区町村内格差 / (d) G 移動フロー: 県別。/areas imp を関心 proxy に ──
let prefs = [];
try {
  prefs = JSON.parse(fs.readFileSync(PREFS_PATH, "utf8"));
} catch {
  console.error("[warn] prefectures.json が読めない — F/G 候補をスキップ");
}
for (const { prefCode, prefName } of prefs) {
  const areaImp = gscAreas.get(prefCode) || 0;
  const fStem = `${prefName}の市町村財政`;
  if (!coveredBy(coverage, fStem)) {
    candidates.push({
      topicKey: `finance-gap-${prefCode}`,
      archetype: "F",
      metricKeys: [],
      label: `${prefName} 市区町村の財政格差 (決算カード)`,
      source: "finance-cards",
      scores: {
        queryGap: normImp(areaImp, maxAreaImp) * 0.7, // 県ページ imp は間接 proxy なので減衰
        seasonality: 0,
        surprise: 0,
        competitionGap: COMPETITION_GAP.F,
      },
      evidence: { areaImp, dataPath: `apps/web/public/finance-cards/cities/`, areaUrl: `/areas/${prefCode}` },
      suggestedTitle: `${prefName} 財政が厳しい市町村`,
    });
  }
  const gSeason = seasonalityScore(seasonPatterns, "移住転出", nowMonth);
  if (!coveredBy(coverage, `${prefName}の転出`)) {
    candidates.push({
      topicKey: `migration-${prefCode}`,
      archetype: "G",
      metricKeys: ["population-migration-inter-prefecture"],
      label: `${prefName} の人口移動フロー (転出先/転入元)`,
      source: "migration-flow",
      scores: {
        queryGap: normImp(areaImp, maxAreaImp) * 0.7,
        seasonality: gSeason.score,
        surprise: 0,
        competitionGap: COMPETITION_GAP.G,
      },
      evidence: { areaImp, dataKey: `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json`, areaUrl: `/areas/${prefCode}` },
      suggestedTitle: `${prefName}の人はどこへ移住する`,
    });
  }
}

// ── combined スコア + lane ──────────────────────────────────────────────────
for (const c of candidates) {
  const s = c.scores;
  c.combinedScore =
    Math.round(
      (WEIGHTS.queryGap * s.queryGap +
        WEIGHTS.seasonality * s.seasonality +
        WEIGHTS.surprise * s.surprise +
        WEIGHTS.competitionGap * s.competitionGap) *
        1000,
    ) / 1000;
  c.lane = (c.evidence.gscImp || 0) >= MUST_WRITE_IMP ? "must-write" : "opportunity";
}
const LANE_RANK = { "must-write": 0, opportunity: 1 };
candidates.sort((x, y) => {
  if (LANE_RANK[x.lane] !== LANE_RANK[y.lane]) return LANE_RANK[x.lane] - LANE_RANK[y.lane];
  return y.combinedScore - x.combinedScore;
});

// ── 既存キューの状態を引き継いで upsert ─────────────────────────────────────
const prev = loadQueue();
const prevByKey = new Map((prev?.queue || []).map((e) => [e.topicKey, e]));

const queue = [];
let priority = 0;
const pendingByArchetype = {};
for (const c of candidates) {
  const old = prevByKey.get(c.topicKey);
  let status = "pending";
  let extra = {};
  if (old) {
    if (old.status === "in-progress") {
      status = "in-progress";
      extra = { in_progress_at: old.in_progress_at || null };
    } else if (old.status === "done") {
      status = "done";
      extra = { done_at: old.done_at || null, published_slug: old.published_slug || null, measured: old.measured || null };
    }
  }
  if (status === "pending") {
    const cap = MAX_PENDING_BY_ARCHETYPE[c.archetype] ?? 20;
    if ((pendingByArchetype[c.archetype] || 0) >= cap) continue; // 型別上限で上位のみ保持
    pendingByArchetype[c.archetype] = (pendingByArchetype[c.archetype] || 0) + 1;
  }
  queue.push({ ...c, status, priority: status === "pending" ? ++priority : null, ...extra });
  prevByKey.delete(c.topicKey);
}
// 今回の候補生成に現れなかった in-progress / done は保持 (GSC 変動で消えるのを防ぐ)
for (const [, old] of prevByKey) {
  if (old.status === "in-progress" || old.status === "done") queue.push({ ...old, priority: null });
}

const result = {
  generatedAt: new Date().toISOString(),
  gscWeek: week || null,
  scoring:
    "combined = 0.35*queryGap + 0.25*seasonality + 0.20*surprise + 0.20*competitionGap; lane: must-write (imp>=300) > opportunity",
  summary: summarize(queue),
  queue,
};
saveQueue(result);

const s = result.summary;
process.stderr.write(
  `\ntopic-queue 更新: ${QUEUE_PATH}\n` +
    `  pending ${s.pending} (must-write ${s.mustWritePending}) / in-progress ${s.inProgress} / done ${s.done}\n` +
    `  pending 型内訳: ${JSON.stringify(s.byArchetype)}\n\n次の 8 件 (pending 上位):\n`,
);
for (const e of queue.filter((e) => e.status === "pending").slice(0, 8)) {
  process.stderr.write(
    `  #${e.priority} [${e.lane}/${e.archetype}] ${e.topicKey} | score ${e.combinedScore} | imp ${e.evidence.gscImp || e.evidence.areaImp || 0} | ${e.label}\n`,
  );
}
