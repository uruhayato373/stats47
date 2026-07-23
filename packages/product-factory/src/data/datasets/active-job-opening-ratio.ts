/**
 * 実データ スナップショット: 有効求人倍率（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010206）。
 * stats47 の R2 `app/ranking/active-job-opening-ratio/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts active-job-opening-ratio`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "有効求人倍率",
  statsDataId: "0000010206",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "倍",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 有効求人倍率（2022）。47 県の実データ。 */
export const ACTIVE_JOB_OPENING_RATIO_2022: Dataset = normalizeDataset({
  indicator: "有効求人倍率",
  unit: "倍",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1.16 },
    { code: "02000", value: 1.2 },
    { code: "03000", value: 1.33 },
    { code: "04000", value: 1.47 },
    { code: "05000", value: 1.5 },
    { code: "06000", value: 1.66 },
    { code: "07000", value: 1.51 },
    { code: "08000", value: 1.48 },
    { code: "09000", value: 1.23 },
    { code: "10000", value: 1.39 },
    { code: "11000", value: 1.05 },
    { code: "12000", value: 0.96 },
    { code: "13000", value: 1.46 },
    { code: "14000", value: 0.88 },
    { code: "15000", value: 1.75 },
    { code: "16000", value: 1.63 },
    { code: "17000", value: 1.56 },
    { code: "18000", value: 1.94 },
    { code: "19000", value: 1.39 },
    { code: "20000", value: 1.66 },
    { code: "21000", value: 1.7 },
    { code: "22000", value: 1.4 },
    { code: "23000", value: 1.42 },
    { code: "24000", value: 1.51 },
    { code: "25000", value: 1.08 },
    { code: "26000", value: 1.17 },
    { code: "27000", value: 1.22 },
    { code: "28000", value: 1.02 },
    { code: "29000", value: 1.13 },
    { code: "30000", value: 1.08 },
    { code: "31000", value: 1.61 },
    { code: "32000", value: 1.91 },
    { code: "33000", value: 1.51 },
    { code: "34000", value: 1.61 },
    { code: "35000", value: 1.6 },
    { code: "36000", value: 1.3 },
    { code: "37000", value: 1.51 },
    { code: "38000", value: 1.54 },
    { code: "39000", value: 1.16 },
    { code: "40000", value: 1.17 },
    { code: "41000", value: 1.34 },
    { code: "42000", value: 1.27 },
    { code: "43000", value: 1.58 },
    { code: "44000", value: 1.48 },
    { code: "45000", value: 1.58 },
    { code: "46000", value: 1.43 },
    { code: "47000", value: 0.99 },
  ],
});
