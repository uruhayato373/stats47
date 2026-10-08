#!/usr/bin/env node
/**
 * 乳がん (女性) 75歳未満年齢調整死亡率 (人口10万人対・都道府県別) の投入スクリプト。
 *
 * 出典: 国立がん研究センター がん対策情報センター「がん情報サービス がん統計」
 *   「都道府県別 部位別 75歳未満年齢調整死亡率」 pref_CancerSite_mortalityASR75(1995-2024).xls
 *   https://ganjoho.jp/reg_stat/statistics/data/dl/index.html
 *   死亡数=人口動態統計保管統計表 / 人口=国勢調査人口・総務省推計人口 / 基準人口=1985年日本人モデル人口
 *   利用条件: 「がん情報サービス『がん統計』(厚生労働省人口動態統計)」を出典として明記して利用
 *
 * 手順:
 *   1. ダウンロードページから該当 xls の直リンクを解決して取得 (年範囲が更新されても追随)
 *   2. 旧形式 xls (OLE2/BIFF8) を依存なしで読む (.claude/scripts/data/lib/read-xls.mjs)
 *   3. シート asr75 から 部位コード 02112 (乳房、ICD-10 C50) × 性別=女 の 47 都道府県 + 全国 を年別に抽出
 *   4. 検算:
 *      - 47 都道府県 x 全年が欠測なく揃う
 *      - 同ブックの順位表シート asr75rank と、全年・47県の値と並びが完全一致
 *      - 全国値が各年の県別最小〜最大の範囲内、かつ県単純平均との差が 10% 以内
 *   5. .local/r2/app/stats/<key>/values.json へ書き出し (2桁丸め)
 *
 * 実行: node .claude/scripts/data/fetch-cancer-asr75-breast.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import { readXls, sheetToArray } from "./lib/read-xls.mjs";
import { fetchBuffer, writeStatsValues, roundTo, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const INDEX_URL = "https://ganjoho.jp/reg_stat/statistics/data/dl/index.html";
const ORIGIN = "https://ganjoho.jp";
const SITE_CODE = "02112"; // 乳房 (ICD-10 C50)
const SEX = "女";
const METRIC_KEY = "breast-cancer-asr75-mortality-female";

async function main() {
  const html = (await fetchBuffer(INDEX_URL)).toString("utf8");
  const m = html.match(/href="([^"]*pref_CancerSite_mortalityASR75[^"]*\.xls)"/);
  if (!m) throw new Error("pref_CancerSite_mortalityASR75 の xls リンクを解決できません (ページ構造が変化)");
  const url = new URL(m[1], ORIGIN).href;
  console.log(`[fetch] ${url}`);
  const sheets = readXls(await fetchBuffer(encodeURI(decodeURI(url))));
  const asr = sheetToArray(sheets.find((s) => s.name === "asr75"));
  const rank = sheetToArray(sheets.find((s) => s.name === "asr75rank"));

  const head = asr[0];
  if (head[0] !== "コード" || head[3] !== "都道府県" || head[4] !== "性別") throw new Error("asr75 の見出しが想定外");
  const years = head.slice(5).map(Number);
  if (years.some((y) => !Number.isInteger(y))) throw new Error("年見出しが不正");

  const lines = asr.filter((r) => r[0] === SITE_CODE && r[4] === SEX);
  const national = lines.find((r) => r[3] === "全国");
  const byPref = new Map(lines.filter((r) => r[3] !== "全国").map((r) => [r[3], r]));
  if (!national) throw new Error("全国行がありません");
  if (byPref.size !== 47 || PREF_NAMES.some((n) => !byPref.has(n))) throw new Error(`都道府県行 ${byPref.size}/47`);

  // --- 検算1: 欠測なし ---
  for (const [name, r] of byPref) {
    years.forEach((y, i) => {
      const v = r[5 + i];
      if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`欠測: ${name} ${y}`);
    });
  }

  // --- 検算2: 順位表シート (asr75rank) と全年・全県で一致 ---
  const rhead = rank[0]; // [null,null,null,null,1995,null,1996,...]
  const rankRows = rank.filter((r) => r[0] === SITE_CODE && r[2] === SEX);
  if (rankRows.length !== 47) throw new Error(`asr75rank の行 ${rankRows.length}/47`);
  years.forEach((y, yi) => {
    const col = rhead.findIndex((c) => Number(c) === y);
    if (col < 0) throw new Error(`asr75rank に ${y} 列がありません`);
    const listed = rankRows.map((r) => ({ rank: r[3], name: r[col], value: r[col + 1] })).sort((a, b) => a.rank - b.rank);
    const computed = [...byPref.entries()].map(([name, r]) => ({ name, value: r[5 + yi] })).sort((a, b) => a.value - b.value); // 順位表は 1位=最小値 (昇順)
    listed.forEach((l, i) => {
      const c = computed[i];
      if (Math.abs(l.value - c.value) > 1e-6) throw new Error(`順位表と不一致 ${y} 順位${l.rank}: 順位表 ${l.name} ${l.value} / 計算 ${c.name} ${c.value}`);
      if (l.name !== c.name && c.value !== computed[i - 1]?.value && c.value !== computed[i + 1]?.value /* 同値の入れ替えは許容 */) {
        throw new Error(`順位表と県が不一致 ${y} 順位${l.rank}: ${l.name} vs ${c.name}`);
      }
    });
  });

  // --- 検算3: 全国値の妥当性 ---
  years.forEach((y, yi) => {
    const vals = [...byPref.values()].map((r) => r[5 + yi]);
    const nat = national[5 + yi];
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (nat < Math.min(...vals) || nat > Math.max(...vals)) throw new Error(`全国値が県の範囲外 ${y}`);
    if (Math.abs(nat - mean) / mean > 0.1) throw new Error(`全国値と県単純平均の差が10%超 ${y}: ${nat} / ${mean}`);
  });
  console.log(`[verify] OK: 47県 x ${years.length}年(${years[0]}-${years.at(-1)}) 欠測なし / 順位表シートと全年一致 / 全国値の範囲・平均整合`);

  const rows = [];
  for (const [name, r] of byPref) years.forEach((y, i) => rows.push({ areaName: name, yearCode: String(y), value: roundTo(r[5 + i], 2) }));
  writeStatsValues({ metricKey: METRIC_KEY, unit: "人/10万人", rows });
  const last = years.length - 1;
  console.log(`[info] 全国(${years[last]}) ${roundTo(national[5 + last], 2)} / 出典URL ${url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
