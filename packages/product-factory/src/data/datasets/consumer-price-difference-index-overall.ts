/**
 * 実データ スナップショット: 消費者物価地域差指数（総合）（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010212）。
 * stats47 の R2 `app/ranking/consumer-price-difference-index-overall/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts consumer-price-difference-index-overall`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "消費者物価地域差指数（総合）",
  statsDataId: "0000010212",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "全国=100",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 消費者物価地域差指数（総合）（2024）。47 県の実データ。 */
export const CONSUMER_PRICE_DIFFERENCE_INDEX_OVERALL_2024: Dataset = normalizeDataset({
  indicator: "消費者物価地域差指数（総合）",
  unit: "全国=100",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 101.9 },
    { code: "02000", value: 98.5 },
    { code: "03000", value: 100 },
    { code: "04000", value: 100.6 },
    { code: "05000", value: 99.2 },
    { code: "06000", value: 101.4 },
    { code: "07000", value: 98.8 },
    { code: "08000", value: 97.5 },
    { code: "09000", value: 97.6 },
    { code: "10000", value: 96.2 },
    { code: "11000", value: 100.3 },
    { code: "12000", value: 101.2 },
    { code: "13000", value: 104 },
    { code: "14000", value: 103.3 },
    { code: "15000", value: 98 },
    { code: "16000", value: 98.6 },
    { code: "17000", value: 99.5 },
    { code: "18000", value: 99.3 },
    { code: "19000", value: 97.7 },
    { code: "20000", value: 97.9 },
    { code: "21000", value: 97.1 },
    { code: "22000", value: 98.3 },
    { code: "23000", value: 98.1 },
    { code: "24000", value: 98.7 },
    { code: "25000", value: 98.6 },
    { code: "26000", value: 101.1 },
    { code: "27000", value: 99.3 },
    { code: "28000", value: 99.2 },
    { code: "29000", value: 98.1 },
    { code: "30000", value: 98.2 },
    { code: "31000", value: 98.9 },
    { code: "32000", value: 100 },
    { code: "33000", value: 97.7 },
    { code: "34000", value: 98.7 },
    { code: "35000", value: 99.9 },
    { code: "36000", value: 99.3 },
    { code: "37000", value: 98.6 },
    { code: "38000", value: 98.6 },
    { code: "39000", value: 100 },
    { code: "40000", value: 98 },
    { code: "41000", value: 97.7 },
    { code: "42000", value: 99.3 },
    { code: "43000", value: 99.4 },
    { code: "44000", value: 97.4 },
    { code: "45000", value: 97 },
    { code: "46000", value: 96.4 },
    { code: "47000", value: 100.2 },
  ],
});
