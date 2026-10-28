#!/usr/bin/env node
/**
 * refresh-article-data-years.mjs — 公開記事の図のデータを、指標の最新年で取り直す。
 *
 * ブログの図と本文は書いた時点の年のまま固定される。新しい年が R2 に入ると、図の年が古い記事が
 * `data/blog/stale-data-years.json` に出て、是正キュー (`remediation-queue.json`) の `data-refresh` レーンに入る。
 * このスクリプトはその記事の図のうち、自動で取り直せるものの data JSON・source.json・SVG を最新年で作り直し、
 * 本文で古い年を書いた行を一覧にする。本文の書き直しと critic は brushup (`/brushup-blog`、focus `最新データ更新`) が行う。
 *
 *   # 公開中の記事を outbox へ取り出して、何が取り直せるかを見る (書き込まない)
 *   node .claude/scripts/blog/refresh-article-data-years.mjs --slug <slug> --pull
 *   # 取り直す (data JSON・source.json・SVG を書き換える)
 *   node .claude/scripts/blog/refresh-article-data-years.mjs --slug <slug> --pull --apply
 *
 * - 対象は `kind: "ranking"` で data JSON が fetch-ranking-data-r2.mjs の形の図と、2 指標の散布図
 *   (kind `scatter` / `derived-scatter` / `calculated` / `ranking-join` / `composite`)。散布図は今の点が R2 の
 *   どの指標・年の値と一致するかで軸と年を確かめ、両軸の最新の共通年 (無ければ軸ごとの最新年) で点・相関係数・
 *   除外県を作り直す。判定は lib/refresh-chart-year.mjs。それ以外 (同じ指標の年比較・計算した軸・手書き) は
 *   理由を付けて「手作業」に出す
 * - source.json に `yearPinnedReason` がある図 (本文がその年そのものを主題として論じる図) は触らない
 * - 取り直せる図には、本文で図の年と最新年がそれぞれ何回出るかを付ける。図の年が 0 回なら本文は別の年を語っており、
 *   図だけが古い食い違い (固定せず取り直す)。判断の手順は /brushup-blog の focus 最新データ更新
 * - SVG は取り直した図だけを一時ディレクトリで generate-article-charts.ts に描かせて戻す (ほかの図は再生成しない)
 *
 * オプション: --base <dir> (既定 contents/blog) / --pull (無いファイルを R2 公開 URL から取る) /
 *            --apply (書き込む) / --json <path> (結果を JSON で書く)
 * exit: 0 = 完了 / 1 = 引数不正・記事なし / 3 = R2 の取得に失敗
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";
import {
  findYearMentions,
  latestPartition,
  planChartRefresh,
  planScatterRefresh,
  rebuildChartData,
  rebuildScatterData,
  rebuildScatterSource,
  rebuildSource,
  findStaleSourceFields,
  REBUILT_SCATTER_SOURCE_FIELDS,
  SCATTER_SOURCE_KINDS,
  scatterAxisKeys,
} from "./lib/refresh-chart-year.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SLUG = getArg("--slug");
const BASE = getArg("--base") || "contents/blog";
const PULL = args.includes("--pull");
const APPLY = args.includes("--apply");
const JSON_OUT = getArg("--json");

if (!SLUG) {
  console.error("usage: --slug <slug> [--base <dir>] [--pull] [--apply] [--json <path>]");
  process.exit(1);
}

const articleDir = path.resolve(PROJECT_ROOT, BASE, SLUG);
const dataDir = path.join(articleDir, "data");
const articlePath = path.join(articleDir, "article.md");

/** 図 1 枚を構成するファイル (generate-article-charts.ts が出す PC・本文縦長・Instagram の 3 枚を含む)。 */
const chartFiles = (base) => [`${base}.json`, `${base}.source.json`, `${base}.svg`, `${base}-mobile.svg`, `${base}-ig.svg`];

async function fetchR2(key) {
  const res = await fetch(`${R2}/${key}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${key} を取得できない (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function pullMissing(bases) {
  let pulled = 0;
  const targets = [
    ["article.md", articlePath],
    ...bases.flatMap((base) => chartFiles(base).map((file) => [`data/${file}`, path.join(dataDir, file)])),
  ];
  for (const [rel, local] of targets) {
    if (fs.existsSync(local)) continue;
    const body = await fetchR2(`app/blog/${SLUG}/${rel}`);
    if (!body) continue;
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, body);
    pulled++;
  }
  return pulled;
}

const chartBases = (markdown) => [
  ...new Set([...markdown.matchAll(/\]\(data\/([^)]+?)\.svg(?:[?#][^)]*)?\)/g)].map((m) => m[1])),
];

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null);

/** 取り直した図だけを一時ディレクトリで描かせ、SVG を記事の data/ へ戻す。 */
function renderCharts(bases, markdown) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "refresh-years-"));
  try {
    const tmpData = path.join(tmpRoot, SLUG, "data");
    fs.mkdirSync(tmpData, { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, SLUG, "article.md"), markdown);
    for (const base of bases) {
      for (const file of [`${base}.json`, `${base}.source.json`]) {
        fs.copyFileSync(path.join(dataDir, file), path.join(tmpData, file));
      }
    }
    execFileSync("npx", ["tsx", ".claude/scripts/blog/generate-article-charts.ts", "--slug", SLUG, "--base", tmpRoot], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "ignore", "inherit"],
    });
    const written = [];
    for (const base of bases) {
      for (const file of [`${base}.svg`, `${base}-mobile.svg`, `${base}-ig.svg`]) {
        const src = path.join(tmpData, file);
        if (!fs.existsSync(src)) continue;
        fs.copyFileSync(src, path.join(dataDir, file));
        written.push(file);
      }
    }
    return written;
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function main() {
  let pulled = PULL && !fs.existsSync(articlePath) ? await pullMissing([]) : 0;
  if (!fs.existsSync(articlePath)) {
    console.error(`[error] 記事が無い: ${path.relative(PROJECT_ROOT, articlePath)} (--pull で R2 から取り出せる)`);
    process.exit(1);
  }
  const bases = chartBases(fs.readFileSync(articlePath, "utf8"));
  if (PULL) pulled += await pullMissing(bases);
  const markdown = fs.readFileSync(articlePath, "utf8");

  const valuesByKey = new Map();
  const loadValues = async (key) => {
    if (valuesByKey.has(key)) return valuesByKey.get(key);
    const body = await fetchR2(`app/ranking/${key}/values.json`);
    valuesByKey.set(key, body ? JSON.parse(body.toString("utf8")) : null);
    return valuesByKey.get(key);
  };
  const charts = [];
  for (const base of bases) {
    const source = readJson(path.join(dataDir, `${base}.source.json`));
    const data = readJson(path.join(dataDir, `${base}.json`));
    if (SCATTER_SOURCE_KINDS.has(source?.kind)) {
      const keys = scatterAxisKeys(source);
      const axisValues = {};
      for (const key of keys && !keys.sameKey ? [keys.x, keys.y] : []) axisValues[key] = await loadValues(key);
      const plan = planScatterRefresh({ source, data, valuesByKey: axisValues });
      const rankingKey = keys ? `${keys.x} × ${keys.y}` : null;
      charts.push({ base, rankingKey, ...plan, scatter: true, axisValues, source, data });
      continue;
    }
    const key = source?.kind === "ranking" ? source.rankingKey : null;
    const partition = key ? latestPartition(await loadValues(key)) : null;
    const plan = planChartRefresh({ source, data, latestYear: partition?.yearCode ?? null });
    charts.push({ base, rankingKey: source?.rankingKey ?? null, ...plan, partition, source, data });
  }

  const refreshed = charts.filter((c) => c.status === "refresh");
  const fetchedAt = new Date().toISOString();
  const yearCount = (year) => markdown.split(`${year}年`).length - 1;
  /** 図が描いていた年 (散布図は軸ごと)。本文の年の数え上げと古い年の行の検出に使う。 */
  const fromYearsOf = (c) => (c.scatter ? [...new Set([c.axes.x.fromYear, c.axes.y.fromYear])] : [c.fromYear]);
  const toYearsOf = (c) => (c.scatter ? [...new Set([c.axes.x.toYear, c.axes.y.toYear])] : [c.toYear]);
  for (const chart of refreshed) {
    let data;
    let notes;
    let nextSource;
    let staleFields;
    if (chart.scatter) {
      const rebuilt = rebuildScatterData(chart.data, chart, chart.axisValues);
      data = rebuilt.data;
      nextSource = rebuildScatterSource(
        chart.source,
        chart,
        { excluded: rebuilt.excluded, pearsonR: rebuilt.pearsonR, pointCount: rebuilt.data.points.length },
        fetchedAt,
      );
      const r = rebuilt.pearsonR == null ? "計算できない" : rebuilt.pearsonR.toFixed(3);
      const oldR = typeof chart.source.pearsonR === "number" ? `${chart.source.pearsonR.toFixed(3)} → ` : "";
      notes = [...rebuilt.notes, `相関係数 r = ${oldR}${r} (${rebuilt.data.points.length} 点)`];
      staleFields = fromYearsOf(chart)
        .filter((year) => !toYearsOf(chart).includes(year))
        .flatMap((year) => findStaleSourceFields(nextSource, year, REBUILT_SCATTER_SOURCE_FIELDS).map((field) => `${field} (${year}年)`));
    } else {
      ({ data, notes } = rebuildChartData(chart.data, chart.partition, chart));
      nextSource = rebuildSource(chart.source, chart, fetchedAt);
      staleFields = findStaleSourceFields(nextSource, chart.fromYear).map((field) => `${field} (${chart.fromYear}年)`);
    }
    chart.notes = [
      ...notes,
      ...(staleFields.length > 0 ? [`手作業: source.json の ${staleFields.join("・")} に元の年の値が残る`] : []),
      `本文: ${[...fromYearsOf(chart), ...toYearsOf(chart)]
        .filter((year, i, all) => all.indexOf(year) === i)
        .map((year) => `${year}年 ${yearCount(year)} 回`)
        .join(" / ")}`,
    ];
    if (!APPLY) continue;
    fs.writeFileSync(path.join(dataDir, `${chart.base}.json`), `${JSON.stringify(data, null, 2)}\n`);
    fs.writeFileSync(path.join(dataDir, `${chart.base}.source.json`), `${JSON.stringify(nextSource, null, 2)}\n`);
  }
  const svgs = APPLY && refreshed.length > 0 ? renderCharts(refreshed.map((c) => c.base), markdown) : [];
  const mentions = findYearMentions(
    markdown,
    refreshed.flatMap((c) => fromYearsOf(c).filter((year) => !toYearsOf(c).includes(year))),
  );

  const summary = {
    slug: SLUG,
    article: path.relative(PROJECT_ROOT, articlePath),
    applied: APPLY,
    pulled,
    charts: charts.map(({ base, rankingKey, status, reason, fromYear, toYear, notes }) => ({
      base,
      rankingKey,
      status,
      ...(reason ? { reason } : {}),
      ...(fromYear ? { fromYear, toYear } : {}),
      ...(notes?.length ? { notes } : {}),
    })),
    svgs,
    yearMentions: mentions,
  };
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, `${JSON.stringify(summary, null, 2)}\n`);

  const LABEL = { refresh: APPLY ? "取り直した" : "取り直せる", current: "最新", pinned: "年を固定", unsupported: "手作業", "no-data": "R2 に値なし" };
  console.log(`# ${SLUG} の図の年 (${APPLY ? "書き込み済み" : "確認のみ。--apply で書き込む"})\n`);
  console.log("| 図 | 指標 | 状態 | 年 | 補足 |\n|---|---|---|---|---|");
  for (const c of summary.charts) {
    const years = c.fromYear ? `${c.fromYear} → ${c.toYear}` : "";
    console.log(`| \`${c.base}\` | ${c.rankingKey ? `\`${c.rankingKey}\`` : "-"} | ${LABEL[c.status]} | ${years} | ${[c.reason, ...(c.notes ?? [])].filter(Boolean).join(" / ")} |`);
  }
  if (refreshed.length > 0) {
    console.log(
      "\n補足の「本文: 図の年 N 回 / 最新年 M 回」で直し方を決める。図の年が 0 回なら図だけの食い違い (図だけ取り直す)。" +
        "本文も古い年で一貫していれば本文も書き直す。本文がその年そのものを主題にしているときだけ、" +
        "取り直さず source.json に `yearPinnedReason` を書く。",
    );
    console.log(`\n## 本文で古い年を書いた行 (${mentions.length} 行)\n`);
    for (const m of mentions) console.log(`- L${m.line}: ${m.text.trim().slice(0, 120)}`);
    console.log(
      "\n次: 本文の年と数値を取り直した data JSON に合わせて書き直し、" +
        `\`node .claude/scripts/lib/article-factual-check.mjs ${summary.article} ${path.relative(PROJECT_ROOT, dataDir)}\` → ` +
        "`quality-gate.mjs` → blog-critic を通す。",
    );
  }
}

main().catch((e) => {
  console.error(`[error] ${e instanceof Error ? e.message : String(e)}`);
  process.exit(3);
});
