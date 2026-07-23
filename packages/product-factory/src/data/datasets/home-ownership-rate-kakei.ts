/**
 * 実データ スナップショット: 持家率（都道府県別・2024年）。
 * 出典: 家計調査（総務省）（statsDataId 0003348239）。
 * stats47 の R2 `app/ranking/home-ownership-rate-kakei/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts home-ownership-rate-kakei`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "家計調査（総務省）",
  tableName: "持家率",
  statsDataId: "0003348239",
  url: "https://www.stat.go.jp/data/kakei/index.html",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 持家率（2024）。47 県の実データ。 */
export const HOME_OWNERSHIP_RATE_KAKEI_2024: Dataset = normalizeDataset({
  indicator: "持家率",
  unit: "％",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 63.7 },
    { code: "02000", value: 93.1 },
    { code: "03000", value: 81.4 },
    { code: "04000", value: 69.8 },
    { code: "05000", value: 93.7 },
    { code: "06000", value: 90.1 },
    { code: "07000", value: 90.4 },
    { code: "08000", value: 93.8 },
    { code: "09000", value: 86.9 },
    { code: "10000", value: 92.4 },
    { code: "11000", value: 80.8 },
    { code: "12000", value: 83.3 },
    { code: "13000", value: 83.8 },
    { code: "14000", value: 91.3 },
    { code: "15000", value: 88.9 },
    { code: "16000", value: 90.4 },
    { code: "17000", value: 89 },
    { code: "18000", value: 95 },
    { code: "19000", value: 88.3 },
    { code: "20000", value: 85.2 },
    { code: "21000", value: 93.5 },
    { code: "22000", value: 88.2 },
    { code: "23000", value: 92.9 },
    { code: "24000", value: 94.9 },
    { code: "25000", value: 86.8 },
    { code: "26000", value: 80.7 },
    { code: "27000", value: 79.4 },
    { code: "28000", value: 90.2 },
    { code: "29000", value: 89.4 },
    { code: "30000", value: 88.4 },
    { code: "31000", value: 90.9 },
    { code: "32000", value: 81.8 },
    { code: "33000", value: 85.5 },
    { code: "34000", value: 80.5 },
    { code: "35000", value: 86.9 },
    { code: "36000", value: 76.6 },
    { code: "37000", value: 84.6 },
    { code: "38000", value: 88.4 },
    { code: "39000", value: 74.5 },
    { code: "40000", value: 77 },
    { code: "41000", value: 90.2 },
    { code: "42000", value: 74.5 },
    { code: "43000", value: 76.3 },
    { code: "44000", value: 74.7 },
    { code: "45000", value: 75.5 },
    { code: "46000", value: 76.9 },
    { code: "47000", value: 54.2 },
  ],
});
