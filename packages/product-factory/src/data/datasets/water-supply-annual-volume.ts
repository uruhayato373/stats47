/**
 * 実データ スナップショット: 上水道年間給水量（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010108）。
 * stats47 の R2 `app/ranking/water-supply-annual-volume/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts water-supply-annual-volume`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "上水道年間給水量",
  statsDataId: "0000010108",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "千m3",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 上水道年間給水量（2022）。47 県の実データ。 */
export const WATER_SUPPLY_ANNUAL_VOLUME_2022: Dataset = normalizeDataset({
  indicator: "上水道年間給水量",
  unit: "千m3",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 528064 },
    { code: "02000", value: 131389 },
    { code: "03000", value: 131808 },
    { code: "04000", value: 261235 },
    { code: "05000", value: 103494 },
    { code: "06000", value: 121858 },
    { code: "07000", value: 205937 },
    { code: "08000", value: 311568 },
    { code: "09000", value: 245490 },
    { code: "10000", value: 267723 },
    { code: "11000", value: 817228 },
    { code: "12000", value: 634840 },
    { code: "13000", value: 1550325 },
    { code: "14000", value: 1046609 },
    { code: "15000", value: 279502 },
    { code: "16000", value: 111807 },
    { code: "17000", value: 136180 },
    { code: "18000", value: 93374 },
    { code: "19000", value: 109617 },
    { code: "20000", value: 258520 },
    { code: "21000", value: 255814 },
    { code: "22000", value: 485019 },
    { code: "23000", value: 842835 },
    { code: "24000", value: 245838 },
    { code: "25000", value: 174799 },
    { code: "26000", value: 305744 },
    { code: "27000", value: 1054426 },
    { code: "28000", value: 640086 },
    { code: "29000", value: 150406 },
    { code: "30000", value: 128798 },
    { code: "31000", value: 62141 },
    { code: "32000", value: 77494 },
    { code: "33000", value: 227033 },
    { code: "34000", value: 293221 },
    { code: "35000", value: 165614 },
    { code: "36000", value: 98631 },
    { code: "37000", value: 121694 },
    { code: "38000", value: 144173 },
    { code: "39000", value: 81576 },
    { code: "40000", value: 487310 },
    { code: "41000", value: 84792 },
    { code: "42000", value: 148832 },
    { code: "43000", value: 169787 },
    { code: "44000", value: 123585 },
    { code: "45000", value: 132262 },
    { code: "46000", value: 189201 },
    { code: "47000", value: 182907 },
  ],
});
