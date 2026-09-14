#!/usr/bin/env node
/**
 * note の県別家計記事 (a-kakei-<pref>) 用 evidence-data.json + 裏付けチャート JSON を作る。
 *
 * ★なぜ要るか (2026-09-15):
 *   chart-data.json は十大費目の対全国平均比率までは出すが「なぜその費目が突出しているか」の
 *   根拠は無かった。本スクリプトが SSOT (`packages/data-configs/src/evidence-inventory/kakei-note`)
 *   を読み、突出費目 (dominant) を裏付け指標の都道府県順位と対応付けて後段の本文生成器へ渡す。
 *
 * 出力 (docs/31_note記事原稿/<slug>/ 配下):
 *   - evidence-data.json                                        (本体・下記 EVIDENCE-DATA CONTRACT)
 *   - data/<shareMetricKey>-tile-grid.json                       (dominant 費目の都道府県タイル地図)
 *   - data/<evidenceMetricKey>-prefecture-rankings.json + .source.json (根拠指標 上位2件・各1本)
 *
 * 根拠指標のランキング JSON は fetch-ranking-data-r2.mjs を child_process で呼び出して生成する
 * (スキーマを二重実装しない)。生成後に highlightPref / focusNote の2フィールドだけ後付けで注入する。
 *
 * 使い方:
 *   node .claude/scripts/note/build-kakei-note-evidence-data.mjs --slug a-kakei-kumamoto
 *   node .claude/scripts/note/build-kakei-note-evidence-data.mjs --all
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT_BASE = path.join(ROOT, "docs/31_note記事原稿");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const FETCH_RANKING_SCRIPT = path.join(ROOT, ".claude/scripts/blog/fetch-ranking-data-r2.mjs");
const CAPITALS_PATH = path.join(ROOT, ".claude/scripts/note/data/kakei-capital-cities.json");
const SSOT_PATH = path.join(
  ROOT,
  "packages/data-configs/src/evidence-inventory/kakei-note/expense-evidence.json",
);

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
};

// ---------- SSOT / 補助データ ----------
function loadSsot() {
  return JSON.parse(fs.readFileSync(SSOT_PATH, "utf8"));
}

function loadCapitals() {
  return JSON.parse(fs.readFileSync(CAPITALS_PATH, "utf8"));
}

/** slug 末尾 (a-kakei-<slug> の <slug>) → { prefCode, prefName, cityName } */
function buildSlugIndex(capitals) {
  const index = new Map();
  for (const [prefCode, entry] of Object.entries(capitals)) {
    index.set(entry.slug, { prefCode, prefName: entry.prefName, cityName: entry.cityName });
  }
  return index;
}

// ---------- R2 取得 ----------
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** 47県値 (最新年) を rank 付きで返す。同値は同順位 (competition ranking)。 */
export function computeRanks(values) {
  const finite = values.filter((v) => v.value != null && Number.isFinite(Number(v.value)));
  const sorted = finite.slice().sort((a, b) => Number(b.value) - Number(a.value));
  let rank = 0;
  return sorted.map((v, i) => {
    if (i === 0 || Number(v.value) !== Number(sorted[i - 1].value)) rank = i + 1;
    return { ...v, value: Number(v.value), rank };
  });
}

/** ranking key の最新年データを { year, title, unit, rows } で返す。R2 に無ければ null。 */
async function fetchRankingLatest(key) {
  const values = await fetchJson(`${R2}/app/ranking/${key}/values.json`);
  if (!values) return null;
  const partitions = (values.partitions || []).slice().sort((a, b) => (a.yearCode > b.yearCode ? 1 : -1));
  if (partitions.length === 0) return null;
  const partition = partitions[partitions.length - 1];
  const rows = computeRanks(partition.values || []);
  if (rows.length === 0) return null;

  let title = key;
  let unit = rows[0]?.unit || "";
  const item = await fetchJson(`${R2}/app/ranking/${key}/item.json`);
  if (item?.item) {
    title = item.item.title || item.item.rankingName || title;
    unit = item.item.unit || unit;
  }
  return { year: String(partition.yearCode), title, unit, rows };
}

// ---------- draft.md frontmatter ----------
function readTitleSha(slugDir) {
  const draftPath = path.join(slugDir, "draft.md");
  if (!fs.existsSync(draftPath)) return null;
  const md = fs.readFileSync(draftPath, "utf8");
  const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const m = fm.match(/^title:\s*(?:"(.+?)"|'(.+?)'|(.+?))\s*$/m);
  const title = m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
  if (!title) return null;
  return createHash("sha256").update(title, "utf8").digest("hex");
}

// ---------- dominant 費目の判定 ----------
/**
 * dominant の乖離方向 (side) と根拠指標の想定方向 (direction) から、
 * 期待どおりの向きに強く出ているかを判定する。
 * expectedHigh = 「dominant が above (全国比高) なら、指標も高いほど裏付けになる」の期待。
 * direction が inverse ならその期待を反転する。effectiveRank は「期待方向で見た順位」
 * (期待どおりの向きなら実際の順位、逆向きなら 48-rank で読み替える)。
 */
export function computeVerdict({ side, direction, rank, thresholds }) {
  const expectedHigh = (side === "above") !== (direction === "inverse");
  const effectiveRank = expectedHigh ? rank : 48 - rank;
  const verdict =
    effectiveRank <= thresholds.strong ? "strong" : effectiveRank <= thresholds.weak ? "weak" : "contrary";
  return { expectedHigh, effectiveRank, verdict };
}

export function pickDominant(categoryBreakdown) {
  return categoryBreakdown.reduce((best, cur) => {
    const diff = Math.abs(cur.ratio - 1);
    const bestDiff = Math.abs(best.ratio - 1);
    return diff > bestDiff ? cur : best;
  }, categoryBreakdown[0]);
}

// ---------- 1 slug 分の処理 ----------
async function processSlug(slug, ssot, slugIndex) {
  const slugDir = path.join(OUT_BASE, slug);
  const chartDataPath = path.join(slugDir, "chart-data.json");
  if (!fs.existsSync(chartDataPath)) {
    console.error(`[skip] ${slug}: chart-data.json が無い`);
    return false;
  }
  const chartData = JSON.parse(fs.readFileSync(chartDataPath, "utf8"));

  const titleSha = readTitleSha(slugDir);
  if (!titleSha) {
    console.error(`[skip] ${slug}: draft.md の title を解決できない`);
    return false;
  }

  const shortSlug = slug.replace(/^a-kakei-/, "");
  const loc = slugIndex.get(shortSlug);
  if (!loc) {
    console.error(`[skip] ${slug}: 県庁所在市の対応表に無い`);
    return false;
  }
  const { prefCode, prefName, cityName } = loc;

  const dominant = pickDominant(chartData.categoryBreakdown);
  const side = dominant.ratio >= 1 ? "above" : "below";
  const ssotEntry = ssot.entries.find((e) => e.catName === dominant.catName);
  if (!ssotEntry) {
    console.error(`[skip] ${slug}: SSOT に費目 "${dominant.catName}" が無い`);
    return false;
  }

  const shareRanking = await fetchRankingLatest(ssotEntry.shareMetricKey);
  if (!shareRanking) {
    console.error(`[skip] ${slug}: shareMetricKey ${ssotEntry.shareMetricKey} の R2 データが無い`);
    return false;
  }
  const shareRow = shareRanking.rows.find((r) => r.areaCode === prefCode);
  if (!shareRow) {
    console.error(`[skip] ${slug}: ${ssotEntry.shareMetricKey} に ${prefCode} の値が無い`);
    return false;
  }

  // 優先度順に評価し、R2 データが実在する上位2件を採用する
  const sortedEvidence = ssotEntry.evidence.slice().sort((a, b) => a.priority - b.priority);
  const chosen = [];
  for (const ev of sortedEvidence) {
    if (chosen.length >= 2) break;
    const ranking = await fetchRankingLatest(ev.metricKey);
    if (!ranking) continue;
    const row = ranking.rows.find((r) => r.areaCode === prefCode);
    if (!row) continue;
    chosen.push({ ev, ranking, row });
  }
  if (chosen.length < 2) {
    console.error(
      `[warn] ${slug}: 費目 "${dominant.catName}" の根拠指標が ${chosen.length} 件しか揃わなかった`,
    );
  }

  const thresholds = ssot.thresholds;
  const evidenceOut = chosen.map(({ ev, ranking, row }) => {
    const verdict = computeVerdict({ side, direction: ev.direction, rank: row.rank, thresholds });
    return {
      metricKey: ev.metricKey,
      title: ranking.title,
      unit: ranking.unit,
      year: ranking.year,
      rank: row.rank,
      value: row.value,
      direction: ev.direction,
      ...verdict,
      rankingUrl: `https://stats47.jp/ranking/${ev.metricKey}`,
      chartName: `${ev.metricKey}-prefecture-rankings`,
    };
  });

  const evidenceData = {
    _meta: {
      slug,
      prefCode,
      prefName,
      cityName,
      year: shareRanking.year,
      generatedAt: new Date().toISOString(),
      titleSha,
      thresholds,
      ssotVersion: ssot.version,
    },
    dominant: {
      catName: dominant.catName,
      ratio: dominant.ratio,
      side,
      shareMetricKey: ssotEntry.shareMetricKey,
      shareTitle: shareRanking.title,
      unit: shareRanking.unit,
      year: shareRanking.year,
      rank: shareRow.rank,
      value: shareRow.value,
      rankingUrl: `https://stats47.jp/ranking/${ssotEntry.shareMetricKey}`,
      chartName: `${ssotEntry.shareMetricKey}-tile-grid`,
    },
    evidence: evidenceOut,
  };

  fs.mkdirSync(path.join(slugDir, "data"), { recursive: true });
  fs.writeFileSync(path.join(slugDir, "evidence-data.json"), JSON.stringify(evidenceData, null, 2) + "\n");

  // ---- tile-grid (dominant) ----
  const focusNoteFor = (row, unit) => `${prefName}: ${row.rank}位 ${row.value}${unit}`;
  const tileGrid = {
    title: shareRanking.title,
    subtitle: `${shareRanking.year}年・多い順`,
    unit: shareRanking.unit,
    scheme: side === "above" ? "Blues" : "Oranges",
    legendLabels: ["低い", "高い"],
    rankingKey: ssotEntry.shareMetricKey,
    data: shareRanking.rows.map((r) => ({
      areaCode: r.areaCode,
      areaName: r.areaName,
      rank: r.rank,
      value: r.value,
    })),
    highlightPref: prefCode,
    focusNote: focusNoteFor(shareRow, shareRanking.unit),
  };
  fs.writeFileSync(
    path.join(slugDir, "data", `${ssotEntry.shareMetricKey}-tile-grid.json`),
    JSON.stringify(tileGrid, null, 2) + "\n",
  );

  // ---- 根拠指標のランキング JSON (fetch-ranking-data-r2.mjs へ委譲) ----
  for (const { ev, row } of chosen) {
    const dataName = `${ev.metricKey}-prefecture-rankings`;
    execFileSync(
      process.execPath,
      [
        FETCH_RANKING_SCRIPT,
        "--slug",
        slug,
        "--base",
        "docs/31_note記事原稿",
        "--keys",
        ev.metricKey,
        "--data-name",
        dataName,
      ],
      { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] },
    );
    const outPath = path.join(slugDir, "data", `${dataName}.json`);
    const payload = JSON.parse(fs.readFileSync(outPath, "utf8"));
    payload.highlightPref = prefCode;
    payload.focusNote = focusNoteFor(row, payload.unit || "");
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  }

  console.log(
    `[ok] ${slug}: dominant=${dominant.catName}(${shareRow.rank}位) evidence=${evidenceOut
      .map((e) => `${e.metricKey}:${e.verdict}`)
      .join(",")}`,
  );
  return true;
}

async function main() {
  const ssot = loadSsot();
  const capitals = loadCapitals();
  const slugIndex = buildSlugIndex(capitals);

  const single = arg("--slug");
  const all = process.argv.includes("--all");
  if (!single && !all) {
    console.error("usage: --slug a-kakei-<pref> または --all");
    process.exit(1);
  }

  const targets = single
    ? [single]
    : fs
        .readdirSync(OUT_BASE)
        .filter((d) => /^a-kakei-/.test(d))
        .filter((d) => fs.existsSync(path.join(OUT_BASE, d, "chart-data.json")))
        .sort();

  let ok = 0;
  let failed = 0;
  for (const slug of targets) {
    const success = await processSlug(slug, ssot, slugIndex);
    if (success) ok += 1;
    else failed += 1;
  }
  console.log(`[done] ok=${ok} skipped=${failed}`);
  if (single && ok === 0) process.exit(1);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
