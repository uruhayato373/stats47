/**
 * 実データ スナップショット: 財政力指数（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010104）。
 * stats47 の R2 `app/ranking/fiscal-strength-index-prefecture/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts fiscal-strength-index-prefecture`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "財政力指数",
  statsDataId: "0000010104",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "指数",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 財政力指数（2022）。47 県の実データ。 */
export const FISCAL_STRENGTH_INDEX_PREFECTURE_2022: Dataset = normalizeDataset({
  indicator: "財政力指数",
  unit: "指数",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 0.44422 },
    { code: "02000", value: 0.34201 },
    { code: "03000", value: 0.35368 },
    { code: "04000", value: 0.59081 },
    { code: "05000", value: 0.3094 },
    { code: "06000", value: 0.35964 },
    { code: "07000", value: 0.51343 },
    { code: "08000", value: 0.62125 },
    { code: "09000", value: 0.61003 },
    { code: "10000", value: 0.59896 },
    { code: "11000", value: 0.73883 },
    { code: "12000", value: 0.745 },
    { code: "13000", value: 1.06397 },
    { code: "14000", value: 0.845 },
    { code: "15000", value: 0.45127 },
    { code: "16000", value: 0.45346 },
    { code: "17000", value: 0.48495 },
    { code: "18000", value: 0.40106 },
    { code: "19000", value: 0.37341 },
    { code: "20000", value: 0.50303 },
    { code: "21000", value: 0.52697 },
    { code: "22000", value: 0.67663 },
    { code: "23000", value: 0.86737 },
    { code: "24000", value: 0.56594 },
    { code: "25000", value: 0.53361 },
    { code: "26000", value: 0.56087 },
    { code: "27000", value: 0.74187 },
    { code: "28000", value: 0.61217 },
    { code: "29000", value: 0.40953 },
    { code: "30000", value: 0.31774 },
    { code: "31000", value: 0.27043 },
    { code: "32000", value: 0.25373 },
    { code: "33000", value: 0.50803 },
    { code: "34000", value: 0.58235 },
    { code: "35000", value: 0.42898 },
    { code: "36000", value: 0.312 },
    { code: "37000", value: 0.45137 },
    { code: "38000", value: 0.42197 },
    { code: "39000", value: 0.26114 },
    { code: "40000", value: 0.62027 },
    { code: "41000", value: 0.34091 },
    { code: "42000", value: 0.33263 },
    { code: "43000", value: 0.39703 },
    { code: "44000", value: 0.37136 },
    { code: "45000", value: 0.34084 },
    { code: "46000", value: 0.33868 },
    { code: "47000", value: 0.35962 },
  ],
});
