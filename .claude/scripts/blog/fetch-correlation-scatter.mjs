#!/usr/bin/env node
/**
 * fetch-correlation-scatter.mjs — B型(相関・真因)記事の散布図 data JSON を R2 相関 snapshot から生成する。
 *
 * 相関 snapshot (`app/correlation/by-ranking-key/<base>.json`) には各ペアの scatterData
 * ({areaCode,areaName,x,y}) が埋め込み済み。これを generate-article-charts.ts が読める
 * scatter スキーマ ({title,xLabel,xUnit,yLabel,yUnit,points:[{x,y,label}]}) に変換する。
 * 3点セット (§blog-data-schema §1.5) の source.json も併せて出力し復元可能にする。
 *
 * fetch-ranking-data-r2.mjs (単一 metric のランキング) の姉妹。B型は「2 metric の関係」なので専用。
 *
 * Usage:
 *   node .claude/scripts/blog/fetch-correlation-scatter.mjs --slug <slug> --base <baseKey> --pair <pairKey>
 *   [--base-dir docs/21_ブログ記事原稿] [--data-name <name>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const METRICS_DIR = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SLUG = getArg("--slug");
const BASE = getArg("--base");
const PAIR = getArg("--pair");
const BASE_DIR = getArg("--base-dir", "docs/21_ブログ記事原稿");
if (!SLUG || !BASE || !PAIR) {
  console.error("usage: --slug <slug> --base <baseKey> --pair <pairKey> [--base-dir <dir>] [--data-name <name>]");
  process.exit(1);
}
const DATA_NAME = getArg("--data-name", `${BASE}--${PAIR}`);

// metric config から title/unit を引く (regex 軽量読み。unit は values.json rows にもあるが config が正典)
function metricMeta(key) {
  const file = path.join(METRICS_DIR, `${key}.ts`);
  if (!fs.existsSync(file)) return { title: key, unit: "" };
  const src = fs.readFileSync(file, "utf8");
  return {
    title: src.match(/"title":\s*"([^"]+)"/)?.[1] || key,
    unit: src.match(/"unit":\s*"([^"]+)"/)?.[1] || "",
  };
}

async function main() {
  const url = `${R2_BASE}/app/correlation/by-ranking-key/${BASE}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[error] 相関 snapshot が無い: ${url} (HTTP ${res.status})`);
    process.exit(1);
  }
  const json = await res.json();
  const pair = (json.pairs || []).find((p) => p.rankingKey === PAIR);
  if (!pair) {
    console.error(`[error] ペアが無い: base=${BASE} pair=${PAIR}。利用可能: ${(json.pairs || []).map((p) => p.rankingKey).slice(0, 10).join(", ")}`);
    process.exit(1);
  }
  if (!pair.scatterData || pair.scatterData.length < 30) {
    console.error(`[error] scatterData 不足 (${pair.scatterData?.length || 0} 点 < 30)。散布図の最低データ点未満`);
    process.exit(1);
  }

  const baseMeta = metricMeta(BASE);
  const points = pair.scatterData
    .filter((d) => d.x != null && d.y != null)
    .map((d) => ({ x: d.x, y: d.y, label: d.areaName }));

  const scatter = {
    chartType: "scatter",
    title: `${baseMeta.title} と ${pair.title} の関係`,
    xLabel: baseMeta.title,
    xUnit: baseMeta.unit,
    yLabel: pair.title,
    yUnit: pair.unit || "",
    points,
  };

  const source = {
    kind: "correlation",
    base: BASE,
    pair: PAIR,
    pearsonR: pair.pearsonR,
    partialRPopulation: pair.partialRPopulation ?? null,
    unit: `${baseMeta.unit} × ${pair.unit || ""}`,
    label: scatter.title,
    source: `r2:app/correlation/by-ranking-key/${BASE}.json`,
    restore: `node .claude/scripts/blog/fetch-correlation-scatter.mjs --slug ${SLUG} --base ${BASE} --pair ${PAIR} --data-name ${DATA_NAME}`,
  };

  const outDir = path.join(PROJECT_ROOT, BASE_DIR, SLUG, "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${DATA_NAME}-scatter.json`), JSON.stringify(scatter, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, `${DATA_NAME}-scatter.source.json`), JSON.stringify(source, null, 2) + "\n");

  console.error(
    `[ok] ${DATA_NAME}-scatter.json (${points.length} 点, r=${pair.pearsonR.toFixed(3)}, partialPop=${pair.partialRPopulation != null ? pair.partialRPopulation.toFixed(3) : "?"})\n` +
      `     x=${baseMeta.title}[${baseMeta.unit}] y=${pair.title}[${pair.unit || ""}]\n` +
      `     → ${path.relative(PROJECT_ROOT, outDir)}`,
  );
  if (pair.partialRPopulation != null && Math.abs(pair.partialRPopulation) < 0.45 && Math.abs(pair.pearsonR) > 0.6) {
    console.error(`[warn] 人口統制で偏相関が弱まる (partialPop ${pair.partialRPopulation.toFixed(2)})。「見かけの相関」を本文で必ず言及すること (相関≠因果)`);
  }
}
main();
