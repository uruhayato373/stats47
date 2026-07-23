/**
 * 実データ スナップショット: 平均余命（男・20歳）（都道府県別・2020年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010209）。
 * stats47 の R2 `app/ranking/average-life-expectancy-male/values.json`（最新フル 47 県 = 2020年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts average-life-expectancy-male`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "平均余命（男・20歳）",
  statsDataId: "0000010209",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "年",
  transform: "都道府県別・基準年（2020）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2020）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 平均余命（男・20歳）（2020）。47 県の実データ。 */
export const AVERAGE_LIFE_EXPECTANCY_MALE_2020: Dataset = normalizeDataset({
  indicator: "平均余命（男・20歳）",
  unit: "年",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 61.3 },
    { code: "02000", value: 59.66 },
    { code: "03000", value: 61 },
    { code: "04000", value: 62.02 },
    { code: "05000", value: 60.8 },
    { code: "06000", value: 61.75 },
    { code: "07000", value: 61.05 },
    { code: "08000", value: 61.31 },
    { code: "09000", value: 61.41 },
    { code: "10000", value: 61.43 },
    { code: "11000", value: 61.75 },
    { code: "12000", value: 61.83 },
    { code: "13000", value: 62.08 },
    { code: "14000", value: 62.36 },
    { code: "15000", value: 61.59 },
    { code: "16000", value: 62.03 },
    { code: "17000", value: 62.34 },
    { code: "18000", value: 62.43 },
    { code: "19000", value: 62.09 },
    { code: "20000", value: 63.07 },
    { code: "21000", value: 62.22 },
    { code: "22000", value: 61.98 },
    { code: "23000", value: 62.12 },
    { code: "24000", value: 62 },
    { code: "25000", value: 63.07 },
    { code: "26000", value: 62.54 },
    { code: "27000", value: 61.15 },
    { code: "28000", value: 62.04 },
    { code: "29000", value: 62.76 },
    { code: "30000", value: 61.35 },
    { code: "31000", value: 61.7 },
    { code: "32000", value: 61.93 },
    { code: "33000", value: 62.29 },
    { code: "34000", value: 62.26 },
    { code: "35000", value: 61.5 },
    { code: "36000", value: 61.65 },
    { code: "37000", value: 61.9 },
    { code: "38000", value: 61.43 },
    { code: "39000", value: 61.35 },
    { code: "40000", value: 61.73 },
    { code: "41000", value: 61.74 },
    { code: "42000", value: 61.36 },
    { code: "43000", value: 62.29 },
    { code: "44000", value: 62.2 },
    { code: "45000", value: 61.55 },
    { code: "46000", value: 61.35 },
    { code: "47000", value: 61.08 },
  ],
});
