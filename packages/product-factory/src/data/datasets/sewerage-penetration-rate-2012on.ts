/**
 * 実データ スナップショット: 下水道普及率（都道府県別・2021年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010208）。
 * stats47 の R2 `app/ranking/sewerage-penetration-rate-2012on/values.json`（最新フル 47 県 = 2021年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts sewerage-penetration-rate-2012on`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "下水道普及率",
  statsDataId: "0000010208",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2021",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2021）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2021）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 下水道普及率（2021）。47 県の実データ。 */
export const SEWERAGE_PENETRATION_RATE_2012ON_2021: Dataset = normalizeDataset({
  indicator: "下水道普及率",
  unit: "％",
  year: "2021",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 91.3 },
    { code: "02000", value: 61.9 },
    { code: "03000", value: 62.9 },
    { code: "04000", value: 83.3 },
    { code: "05000", value: 67.3 },
    { code: "06000", value: 78.2 },
    { code: "07000", value: 53.8 },
    { code: "08000", value: 64.2 },
    { code: "09000", value: 69 },
    { code: "10000", value: 55.4 },
    { code: "11000", value: 82.9 },
    { code: "12000", value: 76.6 },
    { code: "13000", value: 99.7 },
    { code: "14000", value: 97 },
    { code: "15000", value: 77.3 },
    { code: "16000", value: 86.4 },
    { code: "17000", value: 84.8 },
    { code: "18000", value: 81.8 },
    { code: "19000", value: 68.4 },
    { code: "20000", value: 84.7 },
    { code: "21000", value: 77.5 },
    { code: "22000", value: 65.3 },
    { code: "23000", value: 80.5 },
    { code: "24000", value: 59.1 },
    { code: "25000", value: 91.9 },
    { code: "26000", value: 94.9 },
    { code: "27000", value: 96.4 },
    { code: "28000", value: 93.5 },
    { code: "29000", value: 82.1 },
    { code: "30000", value: 28.7 },
    { code: "31000", value: 73.3 },
    { code: "32000", value: 50.9 },
    { code: "33000", value: 69.3 },
    { code: "34000", value: 76.6 },
    { code: "35000", value: 67.9 },
    { code: "36000", value: 22.3 },
    { code: "37000", value: 46.3 },
    { code: "38000", value: 56.4 },
    { code: "39000", value: 42 },
    { code: "40000", value: 83.6 },
    { code: "41000", value: 63.3 },
    { code: "42000", value: 63.4 },
    { code: "43000", value: 70.6 },
    { code: "44000", value: 55.8 },
    { code: "45000", value: 60.8 },
    { code: "46000", value: 43 },
    { code: "47000", value: 75.1 },
  ],
});
