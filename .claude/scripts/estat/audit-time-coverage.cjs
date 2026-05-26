#!/usr/bin/env node
/**
 * e-Stat 候補 metric の年度カバレッジを実 API で確認する。
 *
 * 各 metric の statsDataId + cdCat01 から、e-Stat 側に存在する時間軸
 * (time codes) を列挙する。getMetaInfo (軽い) + getStatsData (重い) の併用で、
 * - meta: e-Stat に「定義上」存在する year (TIME class)
 * - data: そのうち実データが返る year (CLASS_OBJ + DATA_INF.VALUE)
 * を区別して報告する。
 *
 * 出力: stdout に markdown table。
 *
 * Usage: node .claude/scripts/estat/audit-time-coverage.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env.local"),
});

const APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
if (!APP_ID) {
  console.error("NEXT_PUBLIC_ESTAT_APP_ID is required");
  process.exit(1);
}

const TARGETS = [
  { label: "総人口", key: "total-population", statsDataId: "0000010101", cdCat01: "A1101" },
  { label: "合計特殊出生率", key: "total-fertility-rate", statsDataId: "0000010101", cdCat01: "A4103" },
  { label: "自殺率(I062)", key: "suicides-per-100k", statsDataId: "0000010209", cdCat01: "#I06201" },
  { label: "自殺率(I910803)", key: "suicide-rate-per-100k", statsDataId: "0000010109", cdCat01: "I910803" },
  { label: "完全失業率", key: "unemployment-rate", statsDataId: "0000010206", cdCat01: "#F01301" },
  { label: "外国人住民(A1700)", key: "foreign-resident-count", statsDataId: "0000010101", cdCat01: "A1700" },
  { label: "外国人住民(A3100)", key: "registered-foreigner-population", statsDataId: "0000010101", cdCat01: "A3100" },
  { label: "延べ宿泊客数", key: "total-overnight-guests", statsDataId: "0000010107", cdCat01: "G7101" },
  { label: "外国人宿泊客数", key: "total-overnight-guests-foreign", statsDataId: "0000010107", cdCat01: "G7102" },
  { label: "製造品出荷額", key: "manufacturing-shipment-amount", statsDataId: "0000010103", cdCat01: "C3401" },
  { label: "農業産出額", key: "agricultural-output", statsDataId: "0000010103", cdCat01: "C3101" },
  { label: "平均寿命(男)", key: "life-expectancy-0-male", statsDataId: "0000010209", cdCat01: "#I0520101" },
  { label: "平均寿命(女)", key: "life-expectancy-0-female", statsDataId: "0000010209", cdCat01: "#I0520102" },
  { label: "空き家率(住宅統計)", key: "vacant-housing-rate", statsDataId: "0004021440", cdCat01: "22" },
  { label: "空き家率(SSDS)", key: "vacant-housing-ratio", statsDataId: "0000010208", cdCat01: "#H01405" },
  { label: "医師数 per 10万", key: "physicians-in-medical-facilities-per-100k", statsDataId: "0000010209", cdCat01: "#I0920101" },
  { label: "婚姻率", key: "marriages-per-total-population", statsDataId: "0000010201", cdCat01: "#A06601" },
  { label: "離婚率", key: "divorces-per-total-population", statsDataId: "0000010201", cdCat01: "#A06602" },
  { label: "交通事故死者率", key: "traffic-accident-deaths-per-100k", statsDataId: "0000010211", cdCat01: "#K04106" },
  { label: "生活保護世帯数", key: "households-on-public-assistance", statsDataId: "0000010110", cdCat01: "J1101" },
  { label: "コンビニ店舗数", key: "convenience-store-count", statsDataId: "0000010108", cdCat01: "H610504" },
];

async function getStatsData(params) {
  const sp = new URLSearchParams({ appId: APP_ID, lang: "J", ...params });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${sp}`;
  const res = await fetch(url);
  return res.json();
}

function extractYears(json) {
  const stat = json?.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!stat) return { years: [], note: json?.GET_STATS_DATA?.RESULT?.ERROR_MSG || "STATISTICAL_DATA missing" };

  const classObjs = [].concat(stat.CLASS_INF?.CLASS_OBJ || []);
  const timeObj = classObjs.find((o) => o["@id"] === "time");
  const allTimes = timeObj ? [].concat(timeObj.CLASS).map((c) => c["@code"]) : [];

  const values = [].concat(stat.DATA_INF?.VALUE || []);
  const dataTimes = [...new Set(values.map((v) => v["@time"]))];

  const yearsFromCode = (codes) =>
    [...new Set(codes.map((c) => c.slice(0, 4)))].sort();

  return {
    years: yearsFromCode(dataTimes),
    metaYears: yearsFromCode(allTimes),
    valueCount: values.length,
  };
}

async function main() {
  console.log("| 候補 | key | meta年範囲 | data年範囲 | data年数 | data件数 | 状況 |");
  console.log("|---|---|---|---|---|---|---|");
  for (const t of TARGETS) {
    try {
      // lvArea: 2 = 都道府県, no time filter → all available years
      const json = await getStatsData({
        statsDataId: t.statsDataId,
        cdCat01: t.cdCat01,
        lvArea: "2",
        limit: "100000",
      });
      const r = extractYears(json);
      const dataRange = r.years.length ? `${r.years[0]}-${r.years[r.years.length - 1]}` : "-";
      const metaRange = r.metaYears?.length ? `${r.metaYears[0]}-${r.metaYears[r.metaYears.length - 1]}` : "-";
      let verdict;
      if (r.years.length >= 30) verdict = "✅ 充分";
      else if (r.years.length >= 15) verdict = "🟡 中";
      else if (r.years.length >= 5) verdict = "🟠 少";
      else verdict = "❌ 不足";
      if (r.note) verdict = `❌ ${r.note}`;
      console.log(`| ${t.label} | \`${t.key}\` | ${metaRange} | ${dataRange} | ${r.years.length} | ${r.valueCount || 0} | ${verdict} |`);
    } catch (e) {
      console.log(`| ${t.label} | \`${t.key}\` | - | - | - | - | ❌ ${e.message.slice(0, 40)} |`);
    }
    // rate limit kindness
    await new Promise((r) => setTimeout(r, 300));
  }
}

main();
