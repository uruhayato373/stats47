/**
 * 実データ スナップショット: 育児をしている人の就業率（都道府県別・2022年）。
 * 出典: 就業構造基本調査（総務省）（statsDataId 0004008577）。
 * stats47 の R2 `app/ranking/childcare-employment-rate/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts childcare-employment-rate`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "就業構造基本調査（総務省）",
  tableName: "育児をしている人の就業率",
  statsDataId: "0004008577",
  url: "https://www.stat.go.jp/data/shugyou/2022/index.html",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 育児をしている人の就業率（2022）。47 県の実データ。 */
export const CHILDCARE_EMPLOYMENT_RATE_2022: Dataset = normalizeDataset({
  indicator: "育児をしている人の就業率",
  unit: "％",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 82.2 },
    { code: "02000", value: 89.2 },
    { code: "03000", value: 90 },
    { code: "04000", value: 84 },
    { code: "05000", value: 89.3 },
    { code: "06000", value: 93 },
    { code: "07000", value: 85.7 },
    { code: "08000", value: 85.5 },
    { code: "09000", value: 85.9 },
    { code: "10000", value: 87.2 },
    { code: "11000", value: 83 },
    { code: "12000", value: 84.8 },
    { code: "13000", value: 86.3 },
    { code: "14000", value: 83.6 },
    { code: "15000", value: 90.8 },
    { code: "16000", value: 91.3 },
    { code: "17000", value: 91.6 },
    { code: "18000", value: 90.6 },
    { code: "19000", value: 87.5 },
    { code: "20000", value: 86.5 },
    { code: "21000", value: 85.9 },
    { code: "22000", value: 85 },
    { code: "23000", value: 82 },
    { code: "24000", value: 83.8 },
    { code: "25000", value: 83.8 },
    { code: "26000", value: 86.1 },
    { code: "27000", value: 82.7 },
    { code: "28000", value: 83 },
    { code: "29000", value: 82.2 },
    { code: "30000", value: 83.7 },
    { code: "31000", value: 93.4 },
    { code: "32000", value: 92.5 },
    { code: "33000", value: 86.3 },
    { code: "34000", value: 84.7 },
    { code: "35000", value: 85.2 },
    { code: "36000", value: 88.3 },
    { code: "37000", value: 86.8 },
    { code: "38000", value: 83.5 },
    { code: "39000", value: 89.2 },
    { code: "40000", value: 85 },
    { code: "41000", value: 89.4 },
    { code: "42000", value: 88.5 },
    { code: "43000", value: 89.5 },
    { code: "44000", value: 87.1 },
    { code: "45000", value: 88.3 },
    { code: "46000", value: 88.3 },
    { code: "47000", value: 88 },
  ],
});
