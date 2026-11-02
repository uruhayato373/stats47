#!/usr/bin/env node
/**
 * 家計調査の品目別「都市ランキング」(県庁所在市と政令指定都市の 52 市・複数年の平均) を e-Stat から作り、
 * ブログの図の入力 (data/<name>-city-ranking.json + .source.json) を書き出す接地器。
 *
 * なぜ要るか (2026-11-02): 報道やクイズの「餃子日本一」「京都市はパンで全国 3 位」は、総務省が公表する 52 市の
 * 3 年平均の順位で、サイトの都道府県別ランキング (県庁所在市の単年値) とは集計が違う。検索でこの順位を探す人が多いのに
 * (GSC W43: 餃子消費量系 約 880 表示・京都のクイズ系 600 表示超、クリックほぼ 0)、一次データから同じ順位を作る手段が無かった。
 * 切り口台帳の「定義を読む」(kakei-definition-reading) と「都市の間で比べる」の材料。
 *
 *   node .claude/scripts/blog/fetch-kakei-city-average.mjs --slug <slug> --name <base> --item 010120000:パン \
 *     [--measure amount|quantity] [--years 2023,2024,2025]
 *
 * 平均は年次値の単純平均を四捨五入する (2022〜2024 年のぎょうざで静岡県企画部統計活用課の令和4〜6年平均と一致を確認)。
 * 出力の各行は 52 市の順位・平均・年ごとの値と、県庁所在市かどうか (isCapital)。read-only で e-Stat を読むだけ。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchStatsData } from "../lib/estat-catalog/api.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TABLES = { amount: "0004023605", quantity: "0004023606" };
/** 県庁所在市でない政令指定都市 (家計調査の 52 市のうち 5 市)。e-Stat の地域コード */
const NON_CAPITAL_CITIES = new Set(["14004", "14150", "22004", "27004", "40003"]);
const NATIONAL = "00000";

function option(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}

async function main() {
  const slug = option("slug");
  const name = option("name");
  const [item, label] = String(option("item", "")).split(":");
  const measure = option("measure", "amount");
  const years = String(option("years", "2023,2024,2025")).split(",").map((y) => y.trim());
  if (!slug || !name || !item || !label || !TABLES[measure]) {
    throw new Error("使い方: --slug <slug> --name <base> --item <cdCat01>:<品目名> [--measure amount|quantity] [--years 2023,2024,2025]");
  }
  const statsDataId = TABLES[measure];
  const res = await fetchStatsData({ statsDataId, cdCat01: item, cdCat02: "03" });
  const data = res.GET_STATS_DATA.STATISTICAL_DATA;
  const values = [].concat(data.DATA_INF?.VALUE ?? []);
  const areaClass = [].concat(data.CLASS_INF.CLASS_OBJ).find((c) => c["@id"] === "area");
  const areaName = Object.fromEntries([].concat(areaClass.CLASS).map((c) => [c["@code"], String(c["@name"]).replace(/^\d+\s*/, "")]));
  const unit = values[0]?.["@unit"] ?? (measure === "amount" ? "円" : "");

  const byArea = new Map();
  for (const v of values) {
    const year = String(v["@time"]).slice(0, 4);
    if (!years.includes(year)) continue;
    const value = Number(v.$);
    if (!Number.isFinite(value)) continue;
    if (!byArea.has(v["@area"])) byArea.set(v["@area"], {});
    byArea.get(v["@area"])[year] = value;
  }
  const national = byArea.get(NATIONAL);
  byArea.delete(NATIONAL);
  const complete = [...byArea].filter(([, ys]) => years.every((y) => ys[y] != null));
  if (complete.length !== 52) throw new Error(`52 市そろわない (${complete.length} 市)。年 ${years.join(",")} に欠測がある`);

  const average = (ys) => Math.round(years.reduce((s, y) => s + ys[y], 0) / years.length);
  const rows = complete
    .map(([code, ys]) => ({ areaCode: code, areaName: areaName[code], value: average(ys), isCapital: !NON_CAPITAL_CITIES.has(code), byYear: ys }))
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ rank: i + 1, ...r, unit }));

  const dir = path.join(PROJECT_ROOT, "contents/blog", slug, "data");
  fs.mkdirSync(dir, { recursive: true });
  const base = `${name}-city-ranking`;
  const title = `${label}の${measure === "amount" ? "支出額" : "購入数量"} (${years[0]}〜${years.at(-1)}年平均)`;
  fs.writeFileSync(
    path.join(dir, `${base}.json`),
    `${JSON.stringify({ title, unit, years, label, measure, nationalAverage: national ? average(national) : null, data: rows }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(dir, `${base}.source.json`),
    `${JSON.stringify(
      {
        kind: "estat",
        statsDataId,
        params: { cdCat01: item, cdCat02: "03" },
        year: `${years[0]}-${years.at(-1)}`,
        unit,
        label: title,
        transform: `県庁所在市と政令指定都市の 52 市について ${years.join("・")} 年の年次値を単純平均し四捨五入して順位を付ける。isCapital=false は県庁所在市でない政令市 (川崎・相模原・浜松・堺・北九州)`,
        source: `e-Stat 家計調査 品目分類 (2025年改定) 年次 ${measure === "amount" ? "金額" : "数量"} ${statsDataId}`,
        restore: `node .claude/scripts/blog/fetch-kakei-city-average.mjs --slug ${slug} --name ${name} --item ${item}:${label} --measure ${measure} --years ${years.join(",")}`,
      },
      null,
      2,
    )}\n`,
  );
  const top = rows.slice(0, 5).map((r) => `${r.rank}. ${r.areaName}${r.isCapital ? "" : "*"} ${r.value}`).join(" / ");
  console.log(`[ok] ${path.relative(PROJECT_ROOT, path.join(dir, base))}.json: 52 市 / 上位 ${top} (* = 県庁所在市でない政令市)`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
