/**
 * 実データ スナップショット: 可住地面積1km²当たり主要道路実延長（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010208）。
 * stats47 の R2 `app/ranking/main-road-length-per-km2/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts main-road-length-per-km2`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "主要道路実延長（可住地面積1km²当たり）",
  statsDataId: "0000010208",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "km",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 可住地面積1km²当たり主要道路実延長（2023）。47 県の実データ。 */
export const MAIN_ROAD_LENGTH_PER_KM2_2023: Dataset = normalizeDataset({
  indicator: "可住地面積1km²当たり主要道路実延長",
  unit: "km",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 0.24 },
    { code: "02000", value: 0.41 },
    { code: "03000", value: 0.32 },
    { code: "04000", value: 0.49 },
    { code: "05000", value: 0.32 },
    { code: "06000", value: 0.39 },
    { code: "07000", value: 0.45 },
    { code: "08000", value: 0.75 },
    { code: "09000", value: 0.58 },
    { code: "10000", value: 0.55 },
    { code: "11000", value: 0.89 },
    { code: "12000", value: 0.76 },
    { code: "13000", value: 1.22 },
    { code: "14000", value: 0.91 },
    { code: "15000", value: 0.53 },
    { code: "16000", value: 0.63 },
    { code: "17000", value: 0.61 },
    { code: "18000", value: 0.57 },
    { code: "19000", value: 0.46 },
    { code: "20000", value: 0.41 },
    { code: "21000", value: 0.44 },
    { code: "22000", value: 0.58 },
    { code: "23000", value: 1.07 },
    { code: "24000", value: 0.66 },
    { code: "25000", value: 0.63 },
    { code: "26000", value: 0.68 },
    { code: "27000", value: 1.29 },
    { code: "28000", value: 0.7 },
    { code: "29000", value: 0.58 },
    { code: "30000", value: 0.63 },
    { code: "31000", value: 0.64 },
    { code: "32000", value: 0.52 },
    { code: "33000", value: 0.64 },
    { code: "34000", value: 0.62 },
    { code: "35000", value: 0.64 },
    { code: "36000", value: 0.6 },
    { code: "37000", value: 1.02 },
    { code: "38000", value: 0.7 },
    { code: "39000", value: 0.45 },
    { code: "40000", value: 0.94 },
    { code: "41000", value: 0.78 },
    { code: "42000", value: 0.65 },
    { code: "43000", value: 0.57 },
    { code: "44000", value: 0.57 },
    { code: "45000", value: 0.41 },
    { code: "46000", value: 0.53 },
    { code: "47000", value: 0.7 },
  ],
});
