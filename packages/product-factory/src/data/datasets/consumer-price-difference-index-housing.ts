/**
 * 実データ スナップショット: 消費者物価地域差指数（住居）（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010212）。
 * stats47 の R2 `app/ranking/consumer-price-difference-index-housing/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts consumer-price-difference-index-housing`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "消費者物価地域差指数（住居）",
  statsDataId: "0000010212",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "全国=100",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 消費者物価地域差指数（住居）（2024）。47 県の実データ。 */
export const CONSUMER_PRICE_DIFFERENCE_INDEX_HOUSING_2024: Dataset = normalizeDataset({
  indicator: "消費者物価地域差指数（住居）",
  unit: "全国=100",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 87.1 },
    { code: "02000", value: 93.8 },
    { code: "03000", value: 95.7 },
    { code: "04000", value: 98.1 },
    { code: "05000", value: 86.7 },
    { code: "06000", value: 100.1 },
    { code: "07000", value: 91.7 },
    { code: "08000", value: 92 },
    { code: "09000", value: 86.6 },
    { code: "10000", value: 89.8 },
    { code: "11000", value: 107.3 },
    { code: "12000", value: 114.4 },
    { code: "13000", value: 127.2 },
    { code: "14000", value: 112.9 },
    { code: "15000", value: 85.4 },
    { code: "16000", value: 92.3 },
    { code: "17000", value: 82.8 },
    { code: "18000", value: 86.7 },
    { code: "19000", value: 94.4 },
    { code: "20000", value: 90.9 },
    { code: "21000", value: 81.3 },
    { code: "22000", value: 93.7 },
    { code: "23000", value: 94.3 },
    { code: "24000", value: 92.1 },
    { code: "25000", value: 88.8 },
    { code: "26000", value: 101.8 },
    { code: "27000", value: 96.6 },
    { code: "28000", value: 95 },
    { code: "29000", value: 93.6 },
    { code: "30000", value: 89 },
    { code: "31000", value: 86.3 },
    { code: "32000", value: 89.2 },
    { code: "33000", value: 82 },
    { code: "34000", value: 87.7 },
    { code: "35000", value: 98.5 },
    { code: "36000", value: 96.7 },
    { code: "37000", value: 83.3 },
    { code: "38000", value: 85 },
    { code: "39000", value: 95.2 },
    { code: "40000", value: 90.5 },
    { code: "41000", value: 87.4 },
    { code: "42000", value: 93.9 },
    { code: "43000", value: 99.2 },
    { code: "44000", value: 85.5 },
    { code: "45000", value: 98.5 },
    { code: "46000", value: 92 },
    { code: "47000", value: 94 },
  ],
});
