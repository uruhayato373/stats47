/**
 * 実データ スナップショット: 可住地面積1km²当たり道路実延長（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010208）。
 * stats47 の R2 `app/ranking/road-length-per-km2/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts road-length-per-km2`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "道路実延長（可住地面積1km²当たり）",
  statsDataId: "0000010208",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "km",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 可住地面積1km²当たり道路実延長（2023）。47 県の実データ。 */
export const ROAD_LENGTH_PER_KM2_2023: Dataset = normalizeDataset({
  indicator: "可住地面積1km²当たり道路実延長",
  unit: "km",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1.15 },
    { code: "02000", value: 2.09 },
    { code: "03000", value: 2.19 },
    { code: "04000", value: 3.49 },
    { code: "05000", value: 2.04 },
    { code: "06000", value: 1.8 },
    { code: "07000", value: 2.84 },
    { code: "08000", value: 9.08 },
    { code: "09000", value: 3.97 },
    { code: "10000", value: 5.47 },
    { code: "11000", value: 12.46 },
    { code: "12000", value: 7.97 },
    { code: "13000", value: 11.09 },
    { code: "14000", value: 10.69 },
    { code: "15000", value: 2.96 },
    { code: "16000", value: 3.28 },
    { code: "17000", value: 3.15 },
    { code: "18000", value: 2.62 },
    { code: "19000", value: 2.5 },
    { code: "20000", value: 3.52 },
    { code: "21000", value: 2.89 },
    { code: "22000", value: 4.73 },
    { code: "23000", value: 9.75 },
    { code: "24000", value: 4.39 },
    { code: "25000", value: 3.13 },
    { code: "26000", value: 3.4 },
    { code: "27000", value: 10.39 },
    { code: "28000", value: 4.35 },
    { code: "29000", value: 3.47 },
    { code: "30000", value: 2.93 },
    { code: "31000", value: 2.56 },
    { code: "32000", value: 2.71 },
    { code: "33000", value: 4.53 },
    { code: "34000", value: 3.41 },
    { code: "35000", value: 2.71 },
    { code: "36000", value: 3.68 },
    { code: "37000", value: 5.47 },
    { code: "38000", value: 3.22 },
    { code: "39000", value: 2.01 },
    { code: "40000", value: 7.59 },
    { code: "41000", value: 4.51 },
    { code: "42000", value: 4.37 },
    { code: "43000", value: 3.52 },
    { code: "44000", value: 2.92 },
    { code: "45000", value: 2.59 },
    { code: "46000", value: 2.98 },
    { code: "47000", value: 3.6 },
  ],
});
