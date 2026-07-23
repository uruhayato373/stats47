/**
 * 実データ スナップショット: 合計特殊出生率（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010101）。
 * stats47 の R2 `app/ranking/total-fertility-rate/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts total-fertility-rate`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "合計特殊出生率",
  statsDataId: "0000010101",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "‐",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 合計特殊出生率（2023）。47 県の実データ。 */
export const TOTAL_FERTILITY_RATE_2023: Dataset = normalizeDataset({
  indicator: "合計特殊出生率",
  unit: "‐",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1.06 },
    { code: "02000", value: 1.23 },
    { code: "03000", value: 1.16 },
    { code: "04000", value: 1.07 },
    { code: "05000", value: 1.1 },
    { code: "06000", value: 1.22 },
    { code: "07000", value: 1.21 },
    { code: "08000", value: 1.22 },
    { code: "09000", value: 1.19 },
    { code: "10000", value: 1.25 },
    { code: "11000", value: 1.14 },
    { code: "12000", value: 1.14 },
    { code: "13000", value: 0.99 },
    { code: "14000", value: 1.13 },
    { code: "15000", value: 1.23 },
    { code: "16000", value: 1.35 },
    { code: "17000", value: 1.34 },
    { code: "18000", value: 1.46 },
    { code: "19000", value: 1.32 },
    { code: "20000", value: 1.34 },
    { code: "21000", value: 1.31 },
    { code: "22000", value: 1.25 },
    { code: "23000", value: 1.29 },
    { code: "24000", value: 1.29 },
    { code: "25000", value: 1.38 },
    { code: "26000", value: 1.11 },
    { code: "27000", value: 1.19 },
    { code: "28000", value: 1.29 },
    { code: "29000", value: 1.21 },
    { code: "30000", value: 1.33 },
    { code: "31000", value: 1.44 },
    { code: "32000", value: 1.46 },
    { code: "33000", value: 1.32 },
    { code: "34000", value: 1.33 },
    { code: "35000", value: 1.4 },
    { code: "36000", value: 1.36 },
    { code: "37000", value: 1.4 },
    { code: "38000", value: 1.31 },
    { code: "39000", value: 1.3 },
    { code: "40000", value: 1.26 },
    { code: "41000", value: 1.46 },
    { code: "42000", value: 1.49 },
    { code: "43000", value: 1.47 },
    { code: "44000", value: 1.39 },
    { code: "45000", value: 1.49 },
    { code: "46000", value: 1.48 },
    { code: "47000", value: 1.6 },
  ],
});
