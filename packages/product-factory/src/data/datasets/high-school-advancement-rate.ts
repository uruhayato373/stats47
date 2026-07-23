/**
 * 実データ スナップショット: 高等学校卒業者の進学率（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010205）。
 * stats47 の R2 `app/ranking/high-school-advancement-rate/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts high-school-advancement-rate`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "高等学校卒業者の進学率",
  statsDataId: "0000010205",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 高等学校卒業者の進学率（2023）。47 県の実データ。 */
export const HIGH_SCHOOL_ADVANCEMENT_RATE_2023: Dataset = normalizeDataset({
  indicator: "高等学校卒業者の進学率",
  unit: "％",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 52.7 },
    { code: "02000", value: 54.2 },
    { code: "03000", value: 49.9 },
    { code: "04000", value: 55.6 },
    { code: "05000", value: 49.4 },
    { code: "06000", value: 51 },
    { code: "07000", value: 50.9 },
    { code: "08000", value: 57.4 },
    { code: "09000", value: 56.9 },
    { code: "10000", value: 57.4 },
    { code: "11000", value: 65.8 },
    { code: "12000", value: 64.7 },
    { code: "13000", value: 74.1 },
    { code: "14000", value: 69.4 },
    { code: "15000", value: 53.7 },
    { code: "16000", value: 58.4 },
    { code: "17000", value: 62.7 },
    { code: "18000", value: 61.2 },
    { code: "19000", value: 62.4 },
    { code: "20000", value: 55.3 },
    { code: "21000", value: 61.1 },
    { code: "22000", value: 58.1 },
    { code: "23000", value: 64 },
    { code: "24000", value: 55.4 },
    { code: "25000", value: 61.7 },
    { code: "26000", value: 74 },
    { code: "27000", value: 68.9 },
    { code: "28000", value: 68.5 },
    { code: "29000", value: 65.2 },
    { code: "30000", value: 57.1 },
    { code: "31000", value: 51.4 },
    { code: "32000", value: 50.1 },
    { code: "33000", value: 56.8 },
    { code: "34000", value: 65.7 },
    { code: "35000", value: 48.5 },
    { code: "36000", value: 59.7 },
    { code: "37000", value: 58.4 },
    { code: "38000", value: 57.7 },
    { code: "39000", value: 57.7 },
    { code: "40000", value: 58.7 },
    { code: "41000", value: 48.4 },
    { code: "42000", value: 49.7 },
    { code: "43000", value: 50.4 },
    { code: "44000", value: 52.1 },
    { code: "45000", value: 48 },
    { code: "46000", value: 48.1 },
    { code: "47000", value: 46.7 },
  ],
});
