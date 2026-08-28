#!/usr/bin/env node
/**
 * analyze-winning-patterns.mjs
 *
 * 「アクセス数の多い記事 = 良い記事」を作業仮説に、トップ記事の構造特徴を
 * 決定的に抽出し、GSC 実測 (CTR / 掲載順位) と突合して「何が勝ちパターンか」を
 * 数値で可視化する。継続的なブログ品質底上げループの "天井を上げる" 側のエンジン。
 *
 *   床を上げる側 = quality-gate.mjs + build-remediation-queue.mjs (blocker 是正)
 *   天井を上げる側 = 本スクリプト (勝ち要因抽出 → blog-quality-standards へ書き戻し)
 *
 * Usage:
 *   node .claude/scripts/blog/analyze-winning-patterns.mjs            # 解析 + レポート + state JSON
 *   node .claude/scripts/blog/analyze-winning-patterns.mjs --min-imp 15
 *   node .claude/scripts/blog/analyze-winning-patterns.mjs --json /tmp/wp.json
 *
 * 出力:
 *   .claude/skills/blog/analyze-winning-patterns/reference/reports/<date>.md
 *   .claude/state/blog/winning-patterns.json                   機械向け (featureSignals + perArticleConformance)
 *
 * 主指標 = CTR (同 impression 条件での "魅力") + 掲載順位 (position)。
 * 生クリック数は検索需要の母数に交絡するため補助。滞在 (GA4) は将来拡張 (per-page snapshot が要る)。
 *
 * ★実証ベース判定 (.claude/rules/evidence-based-judgment.md):
 *   トラフィックが小さい初期は N が少なく相関は弱い。本スクリプトは "信号" を出すだけで
 *   "効果確定" はしない。各 featureSignal に sampleSize と confidence(lo/mid/hi) を付け、
 *   N<10 のものは「弱い信号」とラベルする。書き戻し時は blog-critic / NotebookLM の定性裏取りを伴う。
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isAnchorRow } from "../gsc/analyze-ctr-seesaw.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const MIN_IMP = parseInt(getArg("--min-imp", "15"), 10); // 評価対象にする最低 impression
const JSON_OUT = getArg("--json", path.join(PROJECT_ROOT, ".claude/state/blog/winning-patterns.json"));
const CONCURRENCY = 8;

// ── 1. GSC 最新 snapshot ─────────────────────────────────────────────
function findLatestGscSnapshot() {
  const dir = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
  if (!fs.existsSync(dir)) return null;
  const weeks = fs.readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort();
  for (let i = weeks.length - 1; i >= 0; i--) {
    const p = path.join(dir, weeks[i], "pages.csv");
    if (fs.existsSync(p)) return { week: weeks[i], path: p };
  }
  return null;
}
function loadGsc() {
  const snap = findLatestGscSnapshot();
  if (!snap) return { week: null, bySlug: new Map() };
  const bySlug = new Map();
  const lines = fs.readFileSync(snap.path, "utf8").split("\n").slice(1);
  for (const ln of lines) {
    const c = ln.split(",");
    if (c.length < 5) continue;
    // アンカー行で本文ページの CTR を Map 上書きしない。
    if (isAnchorRow(c[0])) continue;
    const m = c[0].match(/\/blog\/([^/?#]+)/);
    if (!m) continue;
    bySlug.set(m[1], {
      clicks: parseInt(c[1], 10) || 0,
      impressions: parseInt(c[2], 10) || 0,
      ctr: parseFloat(c[3]) || 0,
      position: parseFloat(c[4]) || 0,
    });
  }
  return { week: snap.week, bySlug };
}

// ── 2. 公開記事一覧 ─────────────────────────────────────────────────
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
async function loadPublishedSlugs() {
  const j = JSON.parse(await fetchText(`${R2}/app/blog/all.json`));
  const arts = Array.isArray(j) ? j : j.articles || [];
  return arts
    .filter((a) => a.published !== false)
    .map((a) => ({ slug: a.slug, publishedAt: a.publishedAt || null }));
}

// ── 3. 記事の構造特徴抽出 (決定的) ───────────────────────────────────
const CURIOSITY = ["なぜ", "意外", "唯一", "真因", "vs", "逆転", "?", "？", "倍", "→"];
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (m) {
    for (const ln of m[1].split("\n")) {
      const kv = ln.match(/^(\w+):\s*(.*)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
    }
  }
  return fm;
}
function getProseForTone(text) {
  let t = text.replace(/^---[\s\S]*?\n---\n/, "");
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, "").replace(/<[^>]+>/g, "");
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  t = t
    .split("\n")
    .filter((l) => !/^\s*\|/.test(l) && !/^\s*>/.test(l) && !/^\s*#{1,6}\s/.test(l))
    .join("\n");
  return t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}
const DEARU = [/である[。、]/g, /であった[。、]/g, /だった[。、]/g, /ではない。/g, /だろう[。、]/g, /のだ[。、]/g, /のである[。、]/g, /(?<![んでぐ])だ。/g];
function countDearu(md) {
  const p = getProseForTone(md);
  return DEARU.reduce((n, re) => n + (p.match(re) || []).length, 0);
}
function proseChars(md) {
  let s = md.replace(/^---[\s\S]*?\n---\n/, "").replace(/```[\s\S]*?```/g, "");
  s = s.replace(/^\s*\|.*\|\s*$/gm, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  s = s.replace(/<[^>]+>/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  s = s.replace(/^[#>\s-]+/gm, "").replace(/[*_`~]/g, "");
  return s.replace(/\s/g, "").length;
}
function extractFeatures(slug, md) {
  const fm = parseFrontmatter(md);
  const title = fm.title || "";
  const charts = [...md.matchAll(/!\[[^\]]*\]\(([^)]*\.svg)\)/g)].map((m) => m[1]);
  const chartCount = charts.length;
  const hasMap = charts.some((c) => /tile-grid|[-_]map|tilemap|choropleth/i.test(c)) || /[-_]map$/.test(slug);
  const hasScatter = charts.some((c) => /scatter|散布/i.test(c));
  const hasLine = charts.some((c) => /timeseries|trend|line|推移/i.test(c));
  const callouts = (md.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/gim) || []).length;
  const links =
    (md.match(/\]\((\/(ranking|areas|blog|category|themes|survey)[^)]*)\)/g) || []).length +
    (md.match(/<source-link\s+href=/gi) || []).length;
  const h2 = (md.match(/^##\s+/gm) || []).length;
  const prose = proseChars(md);
  const intro = (() => {
    const body = md.replace(/^---[\s\S]*?\n---\n/, "");
    const firstH2 = body.search(/^##\s/m);
    return proseChars("---\nx: 1\n---\n" + (firstH2 > 0 ? body.slice(0, firstH2) : body));
  })();
  return {
    slug,
    title,
    titleLen: [...title].length,
    curiosityGap: CURIOSITY.some((k) => title.includes(k)),
    archetype: fm.archetype || null,
    chartCount,
    hasMap,
    hasScatter,
    hasLine,
    callouts,
    internalLinks: links,
    h2,
    prose,
    prosePerChart: chartCount ? Math.round(prose / chartCount) : null,
    introChars: intro,
    dearuEndings: countDearu(md),
    desumasu: countDearu(md) === 0,
    tags: (fm.tags || "").length,
  };
}

async function mapLimit(items, n, fn) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]).catch((e) => ({ error: String(e.message || e) }));
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

// ── 4. 勝ち要因シグナル計算 ─────────────────────────────────────────
function median(arr) {
  const a = arr.filter((x) => typeof x === "number").sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round(((a[m - 1] + a[m]) / 2) * 100) / 100;
}
function pct(n, d) {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}
function confidenceOf(nW, nL) {
  const n = Math.min(nW, nL);
  if (n >= 15) return "hi";
  if (n >= 8) return "mid";
  return "lo"; // 弱い信号
}

function buildSignals(winners, losers) {
  const boolFeatures = ["curiosityGap", "hasMap", "hasScatter", "hasLine", "desumasu"];
  const numFeatures = ["titleLen", "chartCount", "callouts", "internalLinks", "h2", "prose", "prosePerChart", "introChars"];
  const signals = [];
  for (const f of boolFeatures) {
    const wRate = pct(winners.filter((a) => a[f]).length, winners.length);
    const lRate = pct(losers.filter((a) => a[f]).length, losers.length);
    signals.push({
      feature: f,
      kind: "bool",
      winnerRate: wRate,
      loserRate: lRate,
      lift: Math.round((wRate - lRate) * 10) / 10,
      confidence: confidenceOf(winners.length, losers.length),
    });
  }
  for (const f of numFeatures) {
    const wM = median(winners.map((a) => a[f]));
    const lM = median(losers.map((a) => a[f]));
    signals.push({
      feature: f,
      kind: "num",
      winnerMedian: wM,
      loserMedian: lM,
      delta: wM != null && lM != null ? Math.round((wM - lM) * 100) / 100 : null,
      confidence: confidenceOf(winners.length, losers.length),
    });
  }
  // lift / delta の絶対値で並べ替え (効きそうな順)
  signals.sort((a, b) => Math.abs(b.lift ?? b.delta ?? 0) - Math.abs(a.lift ?? a.delta ?? 0));
  return signals;
}

// 勝ちプロファイルへの適合度 (0..1)。winner 群の中央値/多数派に近いほど高い。
function buildConformance(all, winners) {
  const wantBool = {};
  for (const f of ["curiosityGap", "desumasu"]) {
    wantBool[f] = pct(winners.filter((a) => a[f]).length, winners.length) >= 50;
  }
  const targets = {
    callouts: median(winners.map((a) => a.callouts)),
    internalLinks: median(winners.map((a) => a.internalLinks)),
    chartCount: median(winners.map((a) => a.chartCount)),
    prosePerChart: median(winners.map((a) => a.prosePerChart)),
  };
  return all.map((a) => {
    let score = 0;
    let max = 0;
    for (const f of Object.keys(wantBool)) {
      max++;
      if (a[f] === wantBool[f]) score++;
    }
    for (const f of Object.keys(targets)) {
      if (targets[f] == null || a[f] == null) continue;
      max++;
      const ratio = Math.min(a[f], targets[f]) / Math.max(a[f], targets[f] || 1);
      score += ratio;
    }
    return { slug: a.slug, conformance: max ? Math.round((score / max) * 100) / 100 : null };
  });
}

// ── 4.5 交絡分析 ────────────────────────────────────────────────────
function quantile(arr, q) {
  const a = arr.filter((x) => typeof x === "number").sort((x, y) => x - y);
  if (!a.length) return null;
  const pos = (a.length - 1) * q;
  const base = Math.floor(pos);
  return a[base + 1] !== undefined ? a[base] + (pos - base) * (a[base + 1] - a[base]) : a[base];
}
function pearson(xs, ys) {
  const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => typeof x === "number" && typeof y === "number");
  const n = pairs.length;
  if (n < 4) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  return dx && dy ? Math.round((num / Math.sqrt(dx * dy)) * 100) / 100 : null;
}
function yearOf(d) {
  const m = String(d || "").match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}
// 掲載順位を統制したシグナル再計算: position の四分位中央バンドに絞り、その中で CTR 中央値で
// 上下に割って各特徴の lift/Δ を再計算。元シグナルと同符号で残れば robust、消えれば confounded。
function analyzeConfounders(articles, signals) {
  const medPos = median(articles.map((a) => a.position));
  const winnersByCtr = [...articles].sort((a, b) => b.ctr - a.ctr).slice(0, Math.floor(articles.length / 3));
  const losersByCtr = [...articles].sort((a, b) => a.ctr - b.ctr).slice(0, Math.floor(articles.length / 3));

  // position の交絡: CTR は順位に依存。winner が単に上位表示なだけかを見る。
  const winnerPos = median(winnersByCtr.map((a) => a.position));
  const loserPos = median(losersByCtr.map((a) => a.position));
  const corrTitlePos = pearson(articles.map((a) => a.titleLen), articles.map((a) => a.position));
  const corrCtrPos = pearson(articles.map((a) => a.ctr), articles.map((a) => a.position));

  // age の交絡: 古い記事ほど被リンク/評価が蓄積し上位化しうる。
  const winnerYear = median(winnersByCtr.map((a) => yearOf(a.publishedAt)));
  const loserYear = median(losersByCtr.map((a) => yearOf(a.publishedAt)));

  // 順位統制バンド (IQR 中央) 内で再計算
  const q1 = quantile(articles.map((a) => a.position), 0.25);
  const q3 = quantile(articles.map((a) => a.position), 0.75);
  const band = articles.filter((a) => a.position >= q1 && a.position <= q3);
  let robust = [];
  if (band.length >= 8) {
    const bByCtr = [...band].sort((a, b) => b.ctr - a.ctr);
    const bt = Math.max(2, Math.floor(band.length / 2));
    const bw = bByCtr.slice(0, bt);
    const bl = bByCtr.slice(-bt);
    const bandSignals = buildSignals(bw, bl);
    const bandMap = new Map(bandSignals.map((s) => [s.feature, s]));
    robust = signals.map((s) => {
      const b = bandMap.get(s.feature);
      const orig = s.lift ?? s.delta ?? 0;
      const ctrl = b ? (b.lift ?? b.delta ?? 0) : 0;
      const sameSign = orig === 0 ? false : Math.sign(orig) === Math.sign(ctrl);
      const persists = sameSign && Math.abs(ctrl) >= Math.abs(orig) * 0.5;
      return {
        feature: s.feature,
        rawEffect: orig,
        positionControlledEffect: ctrl,
        verdict: persists ? "robust" : sameSign ? "weakened" : "confounded",
      };
    });
  }

  return {
    note: "CTR は掲載順位に強く依存。winner が単に上位表示でないか、特徴が順位統制後も残るかを検証",
    medianPositionAll: medPos,
    winnerMedianPosition: winnerPos,
    loserMedianPosition: loserPos,
    corr_titleLen_position: corrTitlePos, // 正=長いほど下位 / 負=短いほど下位
    corr_ctr_position: corrCtrPos, // 通常は強い負相関 (上位ほど CTR 高)
    winnerMedianYear: winnerYear,
    loserMedianYear: loserYear,
    positionControlledBand: { q1Position: q1, q3Position: q3, n: band.length },
    robustSignals: robust,
  };
}

// ── 5. main ─────────────────────────────────────────────────────────
async function main() {
  process.stderr.write(`勝ち要因解析: GSC 読み込み中...\n`);
  const gsc = loadGsc();
  if (!gsc.bySlug.size) {
    console.error("[error] GSC snapshot が見つからない (.claude/skills/analytics/gsc-improvement/reference/snapshots/)");
    process.exit(1);
  }
  const published = await loadPublishedSlugs();
  const pubAtBySlug = new Map(published.map((p) => [p.slug, p.publishedAt]));
  // 評価対象 = 公開済 かつ impressions >= MIN_IMP (CTR がノイズにならない母数)
  const evalSlugs = published.map((p) => p.slug).filter((s) => (gsc.bySlug.get(s)?.impressions || 0) >= MIN_IMP);
  process.stderr.write(`公開 ${published.length} 本 / 評価対象 (imp>=${MIN_IMP}) ${evalSlugs.length} 本を取得...\n`);

  const articles = (
    await mapLimit(evalSlugs, CONCURRENCY, async (slug) => {
      const md = await fetchText(`${R2}/app/blog/${slug}/article.md`);
      const feat = extractFeatures(slug, md);
      const g = gsc.bySlug.get(slug);
      return {
        ...feat,
        publishedAt: pubAtBySlug.get(slug) || null,
        ctr: g.ctr,
        position: g.position,
        clicks: g.clicks,
        impressions: g.impressions,
      };
    })
  ).filter((a) => a && !a.error && a.title);

  // winner/loser = CTR 三分位 (上位/下位)。同 impression 母数前提なので CTR が "魅力" の代理。
  const byCtr = [...articles].sort((a, b) => b.ctr - a.ctr);
  const tertile = Math.max(3, Math.floor(byCtr.length / 3));
  const winners = byCtr.slice(0, tertile);
  const losers = byCtr.slice(-tertile);

  const signals = buildSignals(winners, losers);
  const conformance = buildConformance(articles, winners);

  // ── 交絡分析 (★最重要): CTR は掲載順位に強く依存する。順位を部分的に統制して
  // 各シグナルが頑健か (=順位の交絡でないか) を判定する。.claude/rules/evidence-based-judgment.md。
  const confounders = analyzeConfounders(articles, signals);

  const out = {
    generatedAt: new Date().toISOString(),
    gscWeek: gsc.week,
    method: "winner/loser = CTR 三分位 (imp>=" + MIN_IMP + ")。主指標 CTR+position、滞在(GA4)は未統合",
    sample: { evaluated: articles.length, winners: winners.length, losers: losers.length },
    winnerProfile: {
      medianCtr: median(winners.map((a) => a.ctr)),
      medianPosition: median(winners.map((a) => a.position)),
      topExamples: winners.slice(0, 8).map((a) => ({ slug: a.slug, ctr: a.ctr, position: a.position, archetype: a.archetype })),
    },
    loserProfile: {
      medianCtr: median(losers.map((a) => a.ctr)),
      medianPosition: median(losers.map((a) => a.position)),
    },
    featureSignals: signals,
    confounders,
    perArticleConformance: conformance.sort((a, b) => (a.conformance ?? 1) - (b.conformance ?? 1)),
  };

  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 2));
  process.stderr.write(`state JSON: ${JSON_OUT}\n`);

  // ── レポート (人間向け) ──
  const date = new Date().toISOString().slice(0, 10);
  const reportDir = path.join(PROJECT_ROOT, ".claude/skills/blog/analyze-winning-patterns/reference/reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `${date}.md`);
  const sigLine = (s) =>
    s.kind === "bool"
      ? `| ${s.feature} | 勝 ${s.winnerRate}% / 負 ${s.loserRate}% | lift ${s.lift > 0 ? "+" : ""}${s.lift}pt | ${s.confidence} |`
      : `| ${s.feature} | 勝 ${s.winnerMedian} / 負 ${s.loserMedian} | Δ ${s.delta > 0 ? "+" : ""}${s.delta} | ${s.confidence} |`;
  const md = `---
type: blog-winning-patterns
date: ${date}
gscWeek: ${gsc.week}
status: draft
tags: [blog-quality, continuous-learning]
---

# ブログ勝ち要因分析 ${date}

**作業仮説**: アクセス数(検索流入)の多い記事 = 良い記事。主指標は **CTR**(同 impression 条件での魅力) + **掲載順位**。
生クリック数は検索需要に交絡するため補助、滞在(GA4)は将来統合。

- 評価対象: imp ≥ ${MIN_IMP} の公開記事 **${articles.length} 本** (winner/loser = CTR 三分位 各 ${winners.length} 本)
- winner 中央値: CTR **${(out.winnerProfile.medianCtr * 100).toFixed(2)}%** / 順位 ${out.winnerProfile.medianPosition}
- loser 中央値: CTR ${(out.loserProfile.medianCtr * 100).toFixed(2)}% / 順位 ${out.loserProfile.medianPosition}

> [!WARNING]
> N が小さい初期はシグナルが弱い (confidence: hi=N≥15 / mid=N≥8 / lo=弱い信号)。
> **lo の信号で blog-quality-standards を書き換えない**。blog-critic / NotebookLM の定性裏取りを伴うこと
> (.claude/rules/evidence-based-judgment.md)。

## 勝ち記事 TOP (CTR 上位)

${winners.slice(0, 8).map((a) => `- \`${a.slug}\` — CTR ${(a.ctr * 100).toFixed(2)}% / 順位 ${a.position} / archetype ${a.archetype || "—"} / 図${a.chartCount}${a.hasMap ? "(地図含)" : ""}`).join("\n")}

## 特徴シグナル (勝 vs 負、効きそうな順)

| 特徴 | 勝 / 負 | 差 | confidence |
|---|---|---|---|
${signals.map(sigLine).join("\n")}

bool 特徴の lift = winner 群での出現率 − loser 群での出現率 (pt)。num 特徴の Δ = 中央値差。

## 交絡分析 (★順位統制後も残るシグナルだけが信頼できる)

CTR は **掲載順位 (position)** に強く依存する。winner が「単に上位表示なだけ」なら、その特徴は
順位の交絡であって因果ではない。順位を部分統制 (IQR 中央バンドで再計算) して頑健性を判定する。

- winner 中央順位 **${confounders.winnerMedianPosition}** vs loser **${confounders.loserMedianPosition}**
  ${confounders.winnerMedianPosition < confounders.loserMedianPosition - 1 ? "→ winner は明確に上位表示。CTR 差の主因は順位の可能性が高い (特徴は交絡を疑う)" : "→ 順位差は小さい。特徴差が CTR を説明しうる"}
- corr(CTR, 順位) = **${confounders.corr_ctr_position}** (通常は強い負相関)
- corr(タイトル長, 順位) = **${confounders.corr_titleLen_position}** ${Math.abs(confounders.corr_titleLen_position ?? 0) >= 0.3 ? "→ タイトル長は順位と相関。「短い方が勝つ」は順位交絡の疑い" : "→ タイトル長と順位は弱相関"}
- winner 中央公開年 ${confounders.winnerMedianYear} vs loser ${confounders.loserMedianYear} ${(confounders.winnerMedianYear ?? 0) < (confounders.loserMedianYear ?? 0) ? "→ winner はやや古い (被リンク蓄積=上位化の交絡)" : ""}

### 順位統制後の頑健性 (バンド n=${confounders.positionControlledBand.n})

| 特徴 | 生 effect | 順位統制後 | 判定 |
|---|---|---|---|
${confounders.robustSignals.map((r) => `| ${r.feature} | ${r.rawEffect > 0 ? "+" : ""}${r.rawEffect} | ${r.positionControlledEffect > 0 ? "+" : ""}${r.positionControlledEffect} | ${r.verdict === "robust" ? "✅ robust" : r.verdict === "weakened" ? "⚠️ weakened" : "❌ confounded"} |`).join("\n")}

**robust** = 順位統制後も同符号で効果が半分以上残る → 因果候補。**confounded** = 統制で消える → 順位の交絡。
**書き戻してよいのは robust かつ confidence hi/mid のシグナルだけ**。

## 読み方と次アクション

1. **confidence hi/mid の正の lift** → 勝ちパターン候補。\`blog-quality-standards.md\` の archetype / チェックリストに
   反映を検討 (blog-critic で定性裏取り後)。
2. **conformance 低 × GSC 流入あり** の記事 → \`/brushup-blog --target queue\` の opportunity レーンで優先是正。
   低 conformance 上位: ${out.perArticleConformance.slice(0, 5).map((c) => `\`${c.slug}\`(${c.conformance})`).join(", ")}
3. **地図(hasMap)/散布図(hasScatter) の lift** が正なら、該当テーマ記事に \`tile-grid\` / \`scatter\` チャートを標準化。
4. NotebookLM で winner 上位の "なぜ刺さるか" を定性深掘り → 仮説を本レポートに追記。

## 関連
- 仕組み正典: \`.claude/rules/blog-quality-standards.md §継続品質ループ\`
- 床を上げる側: \`.claude/rules/blog-remediation-loop.md\` (\`build-remediation-queue.mjs\`)
- 品質基準(書き戻し先): \`.claude/rules/blog-quality-standards.md\`
`;
  fs.writeFileSync(reportPath, md);
  process.stderr.write(`レポート: ${reportPath}\n`);

  // stdout サマリ
  console.log(`\n勝ち要因分析 (${gsc.week}) — 評価 ${articles.length} 本 / winner ${winners.length} 本`);
  console.log(`winner CTR 中央値 ${(out.winnerProfile.medianCtr * 100).toFixed(2)}% vs loser ${(out.loserProfile.medianCtr * 100).toFixed(2)}%`);
  console.log("上位シグナル:");
  for (const s of signals.slice(0, 6)) {
    console.log("  " + sigLine(s).replace(/\|/g, "").trim());
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
