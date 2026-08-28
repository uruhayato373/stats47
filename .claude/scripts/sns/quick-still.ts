#!/usr/bin/env tsx
/**
 * quick-still.ts
 *
 * 指標キー1つ → 投稿用静止画(SVG, 横長+縦長) + キャプション草稿 を、
 * article.md / slug に一切依存せず一発生成するローカル CLI。
 *
 * 記事執筆パイプライン (fetch-ranking-data-r2.mjs → generate-article-charts.ts) は
 * docs/21_ブログ記事原稿/<slug>/ を前提にしており「まず記事を書く」ことを要求する。
 * これは SNS 投稿の瞬発力（数分で1枚出す）には重すぎるため、
 * 同じ SSOT (R2 app/ranking/<key>) と同じ描画エンジン (@stats47/svg-builder) を再利用し、
 * slug/記事を経由しない単発版として切り出す。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/quick-still.ts --key <rankingKey> [--out <dir>] [--year <YYYY>] [--require-png]
 *
 * 出力 (既定 .local/r2/sns/ranking/<key>/x/ — publish-x が読む正典パス。§2-9 image catalog):
 *   stills/<key>.png       横長カード PNG (960x404、X 添付の既定 = ranking-card)
 *   stills/<key>.svg       横長カード SVG
 *   stills/<key>-ig.svg     縦長カード SVG (1080x1350、Instagram 向け)
 *   stills/<key>-ig.png     縦長カード PNG
 *   source.json             出典 manifest (SSOT配慮: rankingKey のみ保持、生パラメータは複製しない)
 *   caption.txt              投稿キャプション草稿 (publish-x が --caption なしで読む位置)
 *
 * PNG 変換は共通 lib `.claude/scripts/lib/svg-to-png.cjs` に一本化。
 *   - 既定: sharp が無ければ警告して SVG のみ出力 (クラウド生成フェーズ用。PNG は publish 時にローカル再生成)
 *   - `--require-png`: sharp 不在/変換失敗を致命扱い (exit 2)。publish-x --from-queue がローカルで指定
 *
 * exit: 0 = ok / 1 = 引数不正 / 2 = R2 取得失敗 or (--require-png 時) PNG 生成失敗
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateBarChartSvg, type BarItem } from "../../../packages/svg-builder/src/charts/bar-chart.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

// ---------- CLI ----------
const args = process.argv.slice(2);
const getArg = (flag: string): string | null => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const KEY = getArg("--key");
const YEAR = getArg("--year");
const OUT_DIR_ARG = getArg("--out");
const REQUIRE_PNG = args.includes("--require-png");

if (!KEY) {
  console.error("usage: --key <rankingKey> [--out <dir>] [--year <YYYY>] [--require-png]");
  process.exit(1);
}
const rankingKey = KEY;

// 既定は publish-x が読む正典パス `.local/r2/sns/ranking/<key>/x/`。
// caption.txt / source.json はこの base、画像は base/stills/ に置く (§2-9 image catalog)。
const BASE_DIR = OUT_DIR_ARG
  ? path.resolve(OUT_DIR_ARG)
  : path.join(PROJECT_ROOT, ".local", "r2", "sns", "ranking", rankingKey, "x");
const OUT_DIR = path.join(BASE_DIR, "stills");

// ---------- 型 (values.json / item.json の実測 shape) ----------
interface RankingValue {
  areaCode: string;
  areaName: string;
  value: number;
  unit?: string;
}
interface RankingPartition {
  yearCode: string;
  values: RankingValue[];
}
interface RankingValuesPayload {
  rankingKey: string;
  partitions: RankingPartition[];
}
interface RankingItemPayload {
  item?: {
    title?: string;
    rankingName?: string;
    unit?: string;
    categoryKey?: string;
    latestYear?: { yearCode: string; yearName?: string };
    // ★出典名は sourceConfig.source.name (sourceConfig.name というキーは存在しない)
    sourceConfig?: { source?: { name?: string } };
    source?: { name?: string };
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return (await res.json()) as T;
}

// カテゴリの粗い「高い=悪い/良い」判定。判断できなければ orange 既定 (中立)。
// 網羅は目的ではなく、明確なものだけ寄せる (誤判定より orange 既定を優先)。
const BAD_HIGH_HINTS = [
  "abandoned", "death", "crime", "accident", "unemployment", "poverty",
  "divorce", "disaster", "vacant", "debt", "bankrupt",
];
const GOOD_HIGH_HINTS = [
  "income", "salary", "wage", "life-expectancy", "birth-rate", "gdp",
  "population", "employment-rate",
];
function choosePalette(key: string): "red" | "blue" | "orange" {
  const k = key.toLowerCase();
  if (BAD_HIGH_HINTS.some((h) => k.includes(h))) return "red";
  if (GOOD_HIGH_HINTS.some((h) => k.includes(h))) return "blue";
  return "orange";
}

async function main() {
  const valuesUrl = `${R2_BASE}/app/ranking/${rankingKey}/values.json`;
  const itemUrl = `${R2_BASE}/app/ranking/${rankingKey}/item.json`;

  let values: RankingValuesPayload;
  try {
    values = await getJson<RankingValuesPayload>(valuesUrl);
  } catch (e) {
    console.error(`[error] failed to fetch values.json for key=${rankingKey}: ${(e as Error).message}`);
    process.exit(2);
  }

  let item: RankingItemPayload["item"] = {};
  try {
    const it = await getJson<RankingItemPayload>(itemUrl);
    item = it.item || {};
  } catch {
    // item は best-effort。無くても values だけで生成できる。
  }

  const parts = (values.partitions || []).slice().sort((a, b) => (a.yearCode > b.yearCode ? 1 : -1));
  if (parts.length === 0) {
    console.error(`[error] no partitions for key=${KEY}`);
    process.exit(2);
  }
  const partition = YEAR
    ? parts.find((p) => String(p.yearCode) === String(YEAR)) || parts[parts.length - 1]
    : parts[parts.length - 1];

  const sorted = partition.values.slice().sort((a, b) => b.value - a.value);
  if (sorted.length === 0) {
    console.error(`[error] empty values for key=${KEY} year=${partition.yearCode}`);
    process.exit(2);
  }

  const unit = item?.unit || sorted[0]?.unit || "";
  const title = item?.title || item?.rankingName || rankingKey;
  const year = partition.yearCode;
  const source =
    item?.sourceConfig?.source?.name || item?.source?.name || "e-Stat（政府統計の総合窓口）";
  const palette = choosePalette(rankingKey);
  const rightPalette = palette === "red" ? "blue" : palette === "blue" ? "red" : "blue";

  const N = Math.min(5, Math.floor(sorted.length / 2) || 1);
  const top = sorted.slice(0, N);
  const bottom = sorted.slice(-N);

  const barItems: BarItem[] = [
    ...top.map((v, i) => ({
      label: `${i + 1}位 ${v.areaName}`,
      name: v.areaName,
      rank: i + 1,
      value: v.value,
    })),
    { label: "…", value: 0, isSeparator: true },
    ...bottom.map((v, i) => ({
      label: `${sorted.length - N + i + 1}位 ${v.areaName}`,
      name: v.areaName,
      rank: sorted.length - N + i + 1,
      value: v.value,
    })),
  ];

  const baseOptions = {
    title,
    subtitle: `${year}年`,
    source,
    unit,
    palette,
    rightPalette,
  } as const;

  const svgColumns = generateBarChartSvg(barItems, { ...baseOptions, layout: "columns" });
  const svgPortrait = generateBarChartSvg(barItems, { ...baseOptions, layout: "portrait" });

  const provenance = (file: string) =>
    `<!-- data-source: ${file} | generated: ${new Date().toISOString()} -->\n`;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const svgPath = path.join(OUT_DIR, `${KEY}.svg`);
  const igSvgPath = path.join(OUT_DIR, `${KEY}-ig.svg`);
  fs.writeFileSync(svgPath, provenance(`${KEY}.svg`) + svgColumns, "utf8");
  fs.writeFileSync(igSvgPath, provenance(`${KEY}-ig.svg`) + svgPortrait, "utf8");

  // 出典 manifest (SSOT配慮): rankingKey のみ保持。生パラメータは複製しない (blog-data-schema.md §1.5 準拠)。
  const manifest = {
    kind: "ranking",
    rankingKey: KEY,
    year,
    unit,
    label: title,
    transform: "all47 (quick-still が上位5+下位5を抽出)",
    source: `r2:app/ranking/${KEY}/values.json`,
    upstream: "metric config (packages/data-configs) → e-Stat → R2 app/ranking",
    restore: `npx tsx .claude/scripts/sns/quick-still.ts --key ${KEY} --year ${year}`,
    fetchedAt: new Date().toISOString(),
    generatedBy: "quick-still.ts",
  };
  fs.writeFileSync(path.join(BASE_DIR, "source.json"), JSON.stringify(manifest, null, 2));

  // ---------- キャプション草稿 ----------
  const fmt = (v: number) => v.toLocaleString("ja-JP");
  const maxV = sorted[0];
  const minV = sorted[sorted.length - 1];
  const ratio = minV.value !== 0 ? (maxV.value / minV.value).toFixed(1) : "-";
  const topLines = top.map((v, i) => `${i + 1}位 ${v.areaName} ${fmt(v.value)}${unit}`).join("\n");
  const bottomLines = bottom
    .map((v, i) => `${sorted.length - N + i + 1}位 ${v.areaName} ${fmt(v.value)}${unit}`)
    .join("\n");

  const caption = `${title}（${year}年）

【上位】
${topLines}

【下位】
${bottomLines}

1位と最下位で${ratio}倍差。

出典: ${source}（stats47.jp）

#都道府県ランキング #統計 #stats47
`;
  fs.writeFileSync(path.join(BASE_DIR, "caption.txt"), caption, "utf8");

  // ---------- PNG (共通 lib svg-to-png.cjs に一本化) ----------
  // 既定は sharp 不在なら警告して SVG のみ (クラウド生成用)。--require-png で致命化 (publish 時)。
  const pngResults: { file: string; ok: boolean; reason?: string }[] = [];
  const svgToPngMod = await import("../lib/svg-to-png.cjs");
  const svgToPng = (svgToPngMod as { svgToPng: (i: string, o: string) => Promise<{ width: number; height: number }> }).svgToPng;
  for (const [svgFile, pngFile] of [
    [svgPath, path.join(OUT_DIR, `${KEY}.png`)],
    [igSvgPath, path.join(OUT_DIR, `${KEY}-ig.png`)],
  ] as const) {
    try {
      await svgToPng(svgFile, pngFile);
      pngResults.push({ file: path.relative(PROJECT_ROOT, pngFile), ok: true });
    } catch (e) {
      const reason = (e as Error).message;
      pngResults.push({ file: path.relative(PROJECT_ROOT, pngFile), ok: false, reason });
      if (REQUIRE_PNG) {
        console.error(`[error] PNG 生成失敗 (--require-png): ${reason}`);
        process.exit(2);
      }
    }
  }

  const summary = {
    key: KEY,
    year,
    unit,
    title,
    palette,
    outDir: path.relative(PROJECT_ROOT, BASE_DIR),
    files: {
      svgColumns: path.relative(PROJECT_ROOT, svgPath),
      svgPortrait: path.relative(PROJECT_ROOT, igSvgPath),
      source: path.relative(PROJECT_ROOT, path.join(BASE_DIR, "source.json")),
      caption: path.relative(PROJECT_ROOT, path.join(BASE_DIR, "caption.txt")),
    },
    // publish-x が --media に使う正典 PNG パス (§2-9 ranking-card の out_path)
    mediaPath: path.relative(PROJECT_ROOT, path.join(OUT_DIR, `${KEY}.png`)),
    captionPath: path.relative(PROJECT_ROOT, path.join(BASE_DIR, "caption.txt")),
    png: pngResults,
    top: top.map((v, i) => `${i + 1}位 ${v.areaName} ${fmt(v.value)}${unit}`),
    bottom: bottom.map((v, i) => `${sorted.length - N + i + 1}位 ${v.areaName} ${fmt(v.value)}${unit}`),
    ratioMaxMin: ratio,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(`[error] ${(e as Error).message}`);
  process.exit(2);
});
