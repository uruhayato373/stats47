/**
 * 実データ スナップショット: 住宅地地価変動率（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/residential-land-price-change-rate/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts residential-land-price-change-rate`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "住宅地地価変動率",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 住宅地地価変動率（2024）。47 県の実データ。 */
export const RESIDENTIAL_LAND_PRICE_CHANGE_RATE_2024: Dataset = normalizeDataset({
  indicator: "住宅地地価変動率",
  unit: "％",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 0.2 },
    { code: "02000", value: -0.4 },
    { code: "03000", value: -0.2 },
    { code: "04000", value: 1.4 },
    { code: "05000", value: -0.6 },
    { code: "06000", value: -0.2 },
    { code: "07000", value: -0.3 },
    { code: "08000", value: 0.7 },
    { code: "09000", value: -0.4 },
    { code: "10000", value: -0.5 },
    { code: "11000", value: 1.6 },
    { code: "12000", value: 3.2 },
    { code: "13000", value: 4.6 },
    { code: "14000", value: 3.2 },
    { code: "15000", value: -1.1 },
    { code: "16000", value: -0.4 },
    { code: "17000", value: -0.3 },
    { code: "18000", value: -0.7 },
    { code: "19000", value: -0.9 },
    { code: "20000", value: -0.2 },
    { code: "21000", value: -0.8 },
    { code: "22000", value: -0.3 },
    { code: "23000", value: 2.3 },
    { code: "24000", value: -0.3 },
    { code: "25000", value: -0.2 },
    { code: "26000", value: 1.1 },
    { code: "27000", value: 2 },
    { code: "28000", value: 1.2 },
    { code: "29000", value: -0.7 },
    { code: "30000", value: -0.6 },
    { code: "31000", value: -0.7 },
    { code: "32000", value: -1 },
    { code: "33000", value: -0.3 },
    { code: "34000", value: 0.2 },
    { code: "35000", value: -0.1 },
    { code: "36000", value: -1.1 },
    { code: "37000", value: -0.4 },
    { code: "38000", value: -1.2 },
    { code: "39000", value: -0.5 },
    { code: "40000", value: 3.8 },
    { code: "41000", value: 0.7 },
    { code: "42000", value: -0.2 },
    { code: "43000", value: 1 },
    { code: "44000", value: 0.8 },
    { code: "45000", value: 0 },
    { code: "46000", value: -1.1 },
    { code: "47000", value: 5.8 },
  ],
});
