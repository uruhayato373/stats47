#!/usr/bin/env node
/**
 * 遊技店密度 (ぱちんこ店舗数 人口1万人あたり) の投入スクリプト。
 *
 * 出典: 全日本遊技事業協同組合連合会 (全日遊連)
 *   「全国遊技場店舗数及び機械台数 (警察庁発表)」年次HTML表
 *   https://www.zennichiyuren.or.jp/material/report/8.html (2025年12月31日現在)
 *
 * 手順:
 *   1. 全日遊連の年次HTML表を fetch し、都道府県別ぱちんこ店舗数を抽出
 *   2. 地方ブロック計・全国合計 (6,464軒) と突合して検算 (不一致なら投入中止)
 *   3. 既存 metric (japanese-population, R2 app/stats) の 2024年値で人口1万人あたりに換算
 *   4. .local/r2/app/stats/pachinko-shop-density-per-10k/values.json に書き出し
 *      (本番反映は diff-push-r2.ts で別途行う。本スクリプトは書き出しのみ)
 *
 * 実行: node .claude/scripts/data/fetch-pachinko-shop-density.mjs
 *
 * 正典: .claude/rules/data-provenance-standards.md (provenance 9点セット)
 */

import fs from "node:fs";
import path from "node:path";

const REPORT_URL = "https://www.zennichiyuren.or.jp/material/report/8.html";
const POP_URL = "https://storage.stats47.jp/app/stats/japanese-population/values.json";
const POP_YEAR = "2024";
const METRIC_KEY = "pachinko-shop-density-per-10k";
const PROJECT_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../../..");
const OUT_PATH = path.join(
  PROJECT_ROOT,
  ".local/r2/app/stats",
  METRIC_KEY,
  "values.json",
);

// areaCode 順 (01000〜47000) = 全日遊連表のブロック順 (北海道/東北6/東京/関東10/中部6/近畿6/中国5/四国4/九州8) と一致
const AREA_ORDER = [
  ["01000", "北海道"],
  ["02000", "青森"],
  ["03000", "岩手"],
  ["04000", "宮城"],
  ["05000", "秋田"],
  ["06000", "山形"],
  ["07000", "福島"],
  ["08000", "茨城"],
  ["09000", "栃木"],
  ["10000", "群馬"],
  ["11000", "埼玉"],
  ["12000", "千葉"],
  ["13000", "東京"],
  ["14000", "神奈川"],
  ["15000", "新潟"],
  ["16000", "富山"],
  ["17000", "石川"],
  ["18000", "福井"],
  ["19000", "山梨"],
  ["20000", "長野"],
  ["21000", "岐阜"],
  ["22000", "静岡"],
  ["23000", "愛知"],
  ["24000", "三重"],
  ["25000", "滋賀"],
  ["26000", "京都"],
  ["27000", "大阪"],
  ["28000", "兵庫"],
  ["29000", "奈良"],
  ["30000", "和歌山"],
  ["31000", "鳥取"],
  ["32000", "島根"],
  ["33000", "岡山"],
  ["34000", "広島"],
  ["35000", "山口"],
  ["36000", "徳島"],
  ["37000", "香川"],
  ["38000", "愛媛"],
  ["39000", "高知"],
  ["40000", "福岡"],
  ["41000", "佐賀"],
  ["42000", "長崎"],
  ["43000", "熊本"],
  ["44000", "大分"],
  ["45000", "宮崎"],
  ["46000", "鹿児島"],
  ["47000", "沖縄"],
];

// 都道府県別ぱちんこ店舗数 (全日遊連 2025年報告表・2025-12-31現在)。
// HTML の <td>県名</td><td>店舗数</td>...行 から手動抽出 (抽出手順は README コメント参照)。
const SHOP_COUNTS = {
  "01000": 342, // 北海道 (道本部171+旭川57+釧路49+北見30+函館35 = 342)
  "02000": 91,
  "03000": 84,
  "04000": 139,
  "05000": 76,
  "06000": 64,
  "07000": 137,
  "08000": 173,
  "09000": 109,
  "10000": 97,
  "11000": 322,
  "12000": 261,
  "13000": 501,
  "14000": 336,
  "15000": 108,
  "16000": 52,
  "17000": 53,
  "18000": 55,
  "19000": 42,
  "20000": 114,
  "21000": 94,
  "22000": 189,
  "23000": 351,
  "24000": 83,
  "25000": 71,
  "26000": 111,
  "27000": 453,
  "28000": 261,
  "29000": 49,
  "30000": 53,
  "31000": 43,
  "32000": 51,
  "33000": 92,
  "34000": 174,
  "35000": 81,
  "36000": 43,
  "37000": 60,
  "38000": 87,
  "39000": 57,
  "40000": 254,
  "41000": 49,
  "42000": 100,
  "43000": 107,
  "44000": 88,
  "45000": 81,
  "46000": 156,
  "47000": 70,
};

const NATIONAL_TOTAL_PUBLISHED = 6464;

async function main() {
  // --- 検算 1: HTML を再取得し、SHOP_COUNTS と一致するか + 全国合計を突合 ---
  const html = await fetchText(REPORT_URL);
  const extracted = extractShopCounts(html);

  const extractedSum = Object.values(extracted).reduce((a, b) => a + b, 0);
  console.log(`[verify] HTML再取得の抽出件数: ${Object.keys(extracted).length}/47`);
  console.log(`[verify] 抽出値の合計: ${extractedSum} (公表全国計: ${NATIONAL_TOTAL_PUBLISHED})`);

  if (Object.keys(extracted).length !== 47) {
    throw new Error(
      `47都道府県抽出できず (${Object.keys(extracted).length}件)。HTML構造が変化した可能性。投入中止。`
    );
  }
  if (extractedSum !== NATIONAL_TOTAL_PUBLISHED) {
    throw new Error(
      `検算失敗: 抽出合計 ${extractedSum} != 公表全国計 ${NATIONAL_TOTAL_PUBLISHED}。投入中止。`
    );
  }
  for (const [code, name] of AREA_ORDER) {
    if (extracted[code] !== SHOP_COUNTS[code]) {
      throw new Error(
        `${name}(${code}) の再取得値 ${extracted[code]} がハードコード値 ${SHOP_COUNTS[code]} と不一致。投入中止。`
      );
    }
  }
  console.log("[verify] OK: 47都道府県値が再取得値と一致・全国合計もハードコード値=抽出値=公表値=6,464で一致");

  // --- 人口データ取得 (japanese-population, 2024年) ---
  const popPayload = await fetchJson(POP_URL);
  const popByCode = {};
  for (const row of popPayload.rows) {
    if (row.yearCode === POP_YEAR) popByCode[row.areaCode] = row.value;
  }
  const missingPop = AREA_ORDER.filter(([code]) => !(code in popByCode));
  if (missingPop.length > 0) {
    throw new Error(`人口データ欠落: ${missingPop.map((x) => x[1]).join(",")}`);
  }

  // --- 密度算出: 店舗数 ÷ (人口/10000) ---
  const rows = AREA_ORDER.map(([code, name]) => {
    const shops = SHOP_COUNTS[code];
    const pop = popByCode[code];
    const value = Math.round((shops / (pop / 10000)) * 10) / 10;
    return {
      areaCode: code,
      areaName: name,
      yearCode: "2025",
      yearName: "2025",
      value,
      unit: "軒",
    };
  });

  // 参考表示: 上位/下位
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  console.log(`[result] 上位3: ${sorted.slice(0, 3).map((r) => `${r.areaName} ${r.value}`).join(" / ")}`);
  console.log(`[result] 下位3: ${sorted.slice(-3).map((r) => `${r.areaName} ${r.value}`).join(" / ")}`);

  const payload = {
    metricKey: METRIC_KEY,
    entityKind: "prefecture",
    rows,
    meta: {
      rowCount: rows.length,
      yearRange: ["2025", "2025"],
      areaCount: 47,
      generatedAt: new Date().toISOString(),
    },
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`[write] ${OUT_PATH}`);
}

function extractShopCounts(html) {
  // 全日遊連の表は <tr><td>県名</td><td>店舗数</td><td>ぱちんこ台数</td>...</tr> という行が
  // 47都道府県分並ぶ (北海道・東京は別行構造)。都道府県名 → 店舗数 の対応を正規表現で抽出する。
  const nameToCode = {};
  for (const [code, name] of AREA_ORDER) nameToCode[name] = code;
  // 表記ゆれ (県/府 有無) を吸収
  const aliasMap = {
    富山県: "富山", 石川県: "石川", 福井県: "福井", 岐阜県: "岐阜", 愛知県: "愛知", 三重県: "三重",
    京都府: "京都", 大阪府: "大阪",
  };

  const result = {};

  // 北海道は道本部/旭川/釧路/北見/函館の5行合計後の「計」行 (bgcolor=#ffcc66 の rowspan セルの次に計行がある)
  const hokkaidoBlock = html.match(/北海道<\/td>[\s\S]*?<tr class="item">\s*<td>計<\/td>\s*<td>(\d[\d,]*)<\/td>/);
  if (hokkaidoBlock) result["01000"] = Number(hokkaidoBlock[1].replace(/,/g, ""));

  // 東京は単独行 (rowspan なし)
  const tokyoRow = html.match(/<td colspan="1"[^>]*>東京<\/td>\s*<td>&nbsp;<\/td>\s*<td>(\d[\d,]*)<\/td>/);
  if (tokyoRow) result["13000"] = Number(tokyoRow[1].replace(/,/g, ""));

  // その他45県: <td>県名</td>\n<td>数値</td> のペアを全走査
  const rowRe = /<td>([^<]+?)<\/td>\s*<td>(\d[\d,]*)<\/td>/g;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    let name = m[1].trim();
    if (name === "計" || name === "県別/区分") continue;
    if (aliasMap[name]) name = aliasMap[name];
    const code = nameToCode[name];
    if (code && code !== "01000" && code !== "13000" && !(code in result)) {
      result[code] = Number(m[2].replace(/,/g, ""));
    }
  }
  return result;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (stats47 data-ingester)" } });
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${url} -> ${res.status}`);
  return res.json();
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
