#!/usr/bin/env node
/**
 * note の県別家計記事 (a-kakei-<pref>) 用 chart-data.json を作る。
 *
 * ★なぜ要るか (2026-09-06):
 *   .claude/skills/note/generate-kakei-charts は chart-data.json を**読む側**だけが
 *   実装されており、作る側が無かった。そのため a-kakei-* の記事は 1 本も存在しなかった。
 *   本スクリプトが producer を埋める。
 *
 * ★サイト側の食卓記事とは切り口を変える (note の全文重複禁止のため):
 *   サイト = 食料品目を「数量 × 価格」で分解する。
 *   note   = 家計全体を「十大費目の対全国平均比率」で見て、その上で特徴品目を挙げる。
 *
 * 出力 (generate-charts.js が要求する形):
 *   _meta.{prefName, cityName, year}
 *   categoryBreakdown[].{catName, ratio}   十大費目の 全国=1.0 に対する比率
 *   topRatioItems[].{name, ratio}          全国平均比が高い品目
 *   bottomRatioItems[].{name, ratio}       同 低い品目 (ratio > 0 のみ描画される)
 *
 * 使い方:
 *   node .claude/scripts/note/build-kakei-note-chart-data.mjs --pref 01000
 *   node .claude/scripts/note/build-kakei-note-chart-data.mjs --all
 *   ... --out docs/31_note記事原稿   (既定)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const STATS = path.join(ROOT, ".local/r2/app/stats");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

/** ローカルミラー優先、無ければ R2 公開 URL (GET のみ・認証不要)。 */
async function fetchValues(key) {
  const local = path.join(STATS, key, "values.json");
  if (fs.existsSync(local)) {
    const raw = JSON.parse(fs.readFileSync(local, "utf8"));
    return Array.isArray(raw) ? raw : raw.rows;
  }
  const res = await fetch(`${R2}/app/stats/${key}/values.json`);
  if (!res.ok) return null;
  const raw = await res.json();
  return Array.isArray(raw) ? raw : raw.rows;
}

// 十大費目。順序は家計調査の費目番号どおり (読者が見慣れた並び)。
const CATEGORIES = [
  ["食料", "food-expenditure-total"],
  ["住居", "housing-expenditure-total"],
  ["光熱・水道", "utilities-expenditure-total"],
  ["家具・家事用品", "furniture-household-expenditure-total"],
  ["被服及び履物", "clothing-footwear-expenditure-total"],
  ["保健医療", "health-medical-expenditure-total"],
  ["交通・通信", "transport-communication-expenditure-total"],
  ["教育", "education-expenditure-total"],
  ["教養娯楽", "culture-recreation-expenditure-total"],
  ["その他の消費支出", "other-living-expenditure-total"],
];

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

/** 最新年の {areaCode: value}。値が無い県は含めない。 */
function latestByArea(rows) {
  const years = rows.filter((r) => r.value != null).map((r) => String(r.yearCode));
  if (years.length === 0) return null;
  const year = years.sort().at(-1);
  const map = new Map();
  for (const r of rows) {
    if (String(r.yearCode) !== year || r.value == null) continue;
    map.set(r.areaCode, Number(r.value));
  }
  return { year, map };
}

/** 47 県の単純平均。★家計調査の全国値ではないことを呼び出し側が明記すること。 */
const mean = (nums) => nums.reduce((a, b) => a + b, 0) / nums.length;

async function main() {
  const prefectures = JSON.parse(
    fs.readFileSync(path.join(ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
  );
  const outBase = arg("--out", path.join(ROOT, "docs/31_note記事原稿"));

  // 品目名は metric の title から引く (キーの英語名を読者に見せない)
  const titles = JSON.parse(
    fs.readFileSync(path.join(ROOT, ".claude/scripts/note/data/kakei-item-titles.json"), "utf8"),
  );
  // 県庁所在市名 (公開済みの食卓記事から確定した対応表)
  const capitals = JSON.parse(
    fs.readFileSync(path.join(ROOT, ".claude/scripts/note/data/kakei-capital-cities.json"), "utf8"),
  );

  // 1) 十大費目を読む
  const cats = [];
  for (const [catName, key] of CATEGORIES) {
    const rows = await fetchValues(key);
    if (!rows) {
      console.error(`[error] ${key} の values.json が無い。先に page-data-batch --metric ${key} を実行する`);
      process.exit(1);
    }
    const latest = latestByArea(rows);
    if (!latest) {
      console.error(`[error] ${key} に値のある年が無い`);
      process.exit(1);
    }
    cats.push({ catName, key, ...latest });
  }
  const year = cats[0].year;
  if (cats.some((c) => c.year !== year)) {
    console.error(`[error] 費目間で最新年が揃っていない: ${cats.map((c) => `${c.key}=${c.year}`).join(", ")}`);
    process.exit(1);
  }

  // 2) 品目レベル (家計調査の消費支出系) を読む。ディレクトリ走査で拾う。
  // 品目キーは名前辞書 (= active な家計調査の支出額 metric) から取る。
  // ローカルミラーには品目が無いので R2 公開 URL を読む。並列 12 で全件。
  const itemKeys = Object.keys(titles);
  const items = [];
  const CONCURRENCY = 12;
  for (let i = 0; i < itemKeys.length; i += CONCURRENCY) {
    const chunk = itemKeys.slice(i, i + CONCURRENCY);
    const got = await Promise.all(chunk.map(async (key) => [key, await fetchValues(key)]));
    for (const [key, rows] of got) {
      if (!rows) continue;
      const latest = latestByArea(rows);
      // 費目と同じ年で、47 県のうち 40 県以上に値がある品目だけを使う
      if (!latest || latest.year !== year || latest.map.size < 40) continue;
      items.push({ key, map: latest.map });
    }
  }

  const targets = arg("--pref")
    ? prefectures.filter((p) => p.prefCode === arg("--pref") || p.prefCode === `${arg("--pref")}000`)
    : process.argv.includes("--all")
      ? prefectures
      : [];
  if (targets.length === 0) {
    console.error("--pref <code> か --all を指定する");
    process.exit(1);
  }

  let written = 0;
  for (const pref of targets) {
    const code = pref.prefCode;
    if (!capitals[code]) {
      console.error(`[skip] ${pref.prefName}: 県庁所在市の対応表に無い`);
      continue;
    }
    const short = pref.prefName === "北海道" ? "北海道" : pref.prefName.replace(/[都府県]$/, "");

    const categoryBreakdown = cats.map((c) => {
      const v = c.map.get(code);
      const avg = mean([...c.map.values()]);
      return { catName: c.catName, ratio: v == null ? 1 : v / avg };
    });
    if (cats.some((c) => c.map.get(code) == null)) {
      console.error(`[skip] ${pref.prefName}: 費目に欠測があるため出力しない`);
      continue;
    }

    const ratios = [];
    for (const it of items) {
      const v = it.map.get(code);
      if (v == null || v <= 0) continue;
      const avg = mean([...it.map.values()]);
      if (!(avg > 0)) continue;
      const name = titles[it.key];
      if (!name) continue; // 名前を引けない品目は出さない (英語キーを読者に見せない)
      ratios.push({ name, ratio: v / avg });
    }
    ratios.sort((a, b) => b.ratio - a.ratio);

    const data = {
      _meta: {
        prefName: pref.prefName,
        cityName: capitals[code].cityName,
        year: Number(year),
        reference: "47都道府県庁所在市の単純平均 = 1.00 (家計調査の全国値ではない)",
        household: "二人以上の世帯",
        source: "総務省統計局 家計調査",
        itemCount: ratios.length,
      },
      categoryBreakdown,
      topRatioItems: ratios.slice(0, 10),
      bottomRatioItems: ratios.slice(-10).reverse(),
    };

    const dir = path.join(outBase, `a-kakei-${capitals[code].slug}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "chart-data.json"), JSON.stringify(data, null, 2) + "\n");
    written += 1;
  }
  console.error(`[ok] ${year}年 / 費目 ${cats.length} / 品目 ${items.length} → ${written} 県分を書き出した`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
