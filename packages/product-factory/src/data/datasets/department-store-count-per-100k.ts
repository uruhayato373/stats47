/**
 * 実データ スナップショット: 人口10万人当たり百貨店数（都道府県別・2006年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010208）。
 * stats47 の R2 `app/ranking/department-store-count-per-100k/values.json`（最新フル 47 県 = 2006年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts department-store-count-per-100k`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "百貨店数（人口10万対）",
  statsDataId: "0000010208",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2006",
  retrievedAt: "2026-07-23",
  unit: "店",
  transform: "都道府県別・基準年（2006）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2006）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 人口10万人当たり百貨店数（2006）。47 県の実データ。 */
export const DEPARTMENT_STORE_COUNT_PER_100K_2006: Dataset = normalizeDataset({
  indicator: "人口10万人当たり百貨店数",
  unit: "店",
  year: "2006",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1.84 },
    { code: "02000", value: 1.76 },
    { code: "03000", value: 1.24 },
    { code: "04000", value: 1.87 },
    { code: "05000", value: 2.03 },
    { code: "06000", value: 1.99 },
    { code: "07000", value: 2.12 },
    { code: "08000", value: 1.14 },
    { code: "09000", value: 1.79 },
    { code: "10000", value: 2.08 },
    { code: "11000", value: 1.62 },
    { code: "12000", value: 1.59 },
    { code: "13000", value: 1.48 },
    { code: "14000", value: 2.13 },
    { code: "15000", value: 1.57 },
    { code: "16000", value: 1.44 },
    { code: "17000", value: 2.13 },
    { code: "18000", value: 1.83 },
    { code: "19000", value: 1.7 },
    { code: "20000", value: 2.01 },
    { code: "21000", value: 1.81 },
    { code: "22000", value: 1.16 },
    { code: "23000", value: 2.18 },
    { code: "24000", value: 1.92 },
    { code: "25000", value: 3.67 },
    { code: "26000", value: 1.81 },
    { code: "27000", value: 1.54 },
    { code: "28000", value: 1.63 },
    { code: "29000", value: 2.12 },
    { code: "30000", value: 1.55 },
    { code: "31000", value: 1.66 },
    { code: "32000", value: 1.76 },
    { code: "33000", value: 2.4 },
    { code: "34000", value: 2.47 },
    { code: "35000", value: 2.36 },
    { code: "36000", value: 1.12 },
    { code: "37000", value: 2.38 },
    { code: "38000", value: 3.29 },
    { code: "39000", value: 1.39 },
    { code: "40000", value: 1.7 },
    { code: "41000", value: 1.39 },
    { code: "42000", value: 1.43 },
    { code: "43000", value: 1.74 },
    { code: "44000", value: 3.4 },
    { code: "45000", value: 2.17 },
    { code: "46000", value: 2.98 },
    { code: "47000", value: 1.97 },
  ],
});
