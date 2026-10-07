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
 * - 対象は `kind: "ranking"` で、data JSON が fetch-ranking-data-r2.mjs の形の図だけ (判定は lib/refresh-chart-year.mjs)。
 *   それ以外 (散布図・計算値・手書き) は理由を付けて「手作業」に出す
 * - source.json に `yearPinnedReason` がある図 (推移の起点の年・手順解説の例など、意図して過去の年を描いた図) は触らない。
 *   古い年が意図したものなら、取り直さずにこの項目を足す
 * - SVG は取り直した図だけを一時ディレクトリで generate-article-charts.ts に描かせて戻す (ほかの図は再生成しない)
 *
 * オプション: --base <dir> (既定 docs/21_ブログ記事原稿) / --pull (無いファイルを R2 公開 URL から取る) /
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
  rebuildChartData,
  rebuildSource,
} from "./lib/refresh-chart-year.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SLUG = getArg("--slug");
const BASE = getArg("--base") || "docs/21_ブログ記事原稿";
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
  const charts = [];
  for (const base of bases) {
    const source = readJson(path.join(dataDir, `${base}.source.json`));
    const data = readJson(path.join(dataDir, `${base}.json`));
    const key = source?.kind === "ranking" ? source.rankingKey : null;
    if (key && !valuesByKey.has(key)) {
      const body = await fetchR2(`app/ranking/${key}/values.json`);
      valuesByKey.set(key, body ? JSON.parse(body.toString("utf8")) : null);
    }
    const partition = key ? latestPartition(valuesByKey.get(key)) : null;
    const plan = planChartRefresh({ source, data, latestYear: partition?.yearCode ?? null });
    charts.push({ base, rankingKey: source?.rankingKey ?? null, ...plan, partition, source, data });
  }

  const refreshed = charts.filter((c) => c.status === "refresh");
  const fetchedAt = new Date().toISOString();
  for (const chart of refreshed) {
    const { data, notes } = rebuildChartData(chart.data, chart.partition, chart);
    chart.notes = notes;
    if (!APPLY) continue;
    fs.writeFileSync(path.join(dataDir, `${chart.base}.json`), `${JSON.stringify(data, null, 2)}\n`);
    fs.writeFileSync(
      path.join(dataDir, `${chart.base}.source.json`),
      `${JSON.stringify(rebuildSource(chart.source, chart, fetchedAt), null, 2)}\n`,
    );
  }
  const svgs = APPLY && refreshed.length > 0 ? renderCharts(refreshed.map((c) => c.base), markdown) : [];
  const mentions = findYearMentions(markdown, refreshed.map((c) => c.fromYear));

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
      "\n古い年を意図して描いた図 (推移の起点の年・手順解説の例など) は取り直さず、" +
        "その図の source.json に `yearPinnedReason` (理由) を書く。",
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
