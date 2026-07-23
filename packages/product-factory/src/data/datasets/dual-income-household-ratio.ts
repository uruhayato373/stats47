/**
 * 実データ スナップショット: 共働き世帯割合（都道府県別・2020年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010206）。
 * stats47 の R2 `app/ranking/dual-income-household-ratio/values.json`（最新フル 47 県 = 2020年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts dual-income-household-ratio`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "共働き世帯割合",
  statsDataId: "0000010206",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2020）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2020）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 共働き世帯割合（2020）。47 県の実データ。 */
export const DUAL_INCOME_HOUSEHOLD_RATIO_2020: Dataset = normalizeDataset({
  indicator: "共働き世帯割合",
  unit: "％",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 20.71 },
    { code: "02000", value: 26.99 },
    { code: "03000", value: 28.7 },
    { code: "04000", value: 24.59 },
    { code: "05000", value: 29.38 },
    { code: "06000", value: 34.4 },
    { code: "07000", value: 27.37 },
    { code: "08000", value: 26.72 },
    { code: "09000", value: 27.39 },
    { code: "10000", value: 28.41 },
    { code: "11000", value: 24.26 },
    { code: "12000", value: 23.13 },
    { code: "13000", value: 17.43 },
    { code: "14000", value: 21.87 },
    { code: "15000", value: 31.03 },
    { code: "16000", value: 32.83 },
    { code: "17000", value: 29.99 },
    { code: "18000", value: 34.69 },
    { code: "19000", value: 29.25 },
    { code: "20000", value: 31.4 },
    { code: "21000", value: 30.87 },
    { code: "22000", value: 29 },
    { code: "23000", value: 25.84 },
    { code: "24000", value: 27.63 },
    { code: "25000", value: 28.53 },
    { code: "26000", value: 20.57 },
    { code: "27000", value: 18.75 },
    { code: "28000", value: 22.79 },
    { code: "29000", value: 24.07 },
    { code: "30000", value: 25.77 },
    { code: "31000", value: 30 },
    { code: "32000", value: 31.22 },
    { code: "33000", value: 25.73 },
    { code: "34000", value: 24.96 },
    { code: "35000", value: 24.06 },
    { code: "36000", value: 25.92 },
    { code: "37000", value: 26.45 },
    { code: "38000", value: 23.79 },
    { code: "39000", value: 23.38 },
    { code: "40000", value: 21.6 },
    { code: "41000", value: 30.93 },
    { code: "42000", value: 26 },
    { code: "43000", value: 27.55 },
    { code: "44000", value: 25.44 },
    { code: "45000", value: 26.52 },
    { code: "46000", value: 24.89 },
    { code: "47000", value: 20.64 },
  ],
});
