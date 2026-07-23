/**
 * 実データ スナップショット: 旅行（1泊2日以上）の行動者率（都道府県別・2021年）。
 * 出典: 社会生活基本調査（総務省）（statsDataId 0003456093）。
 * stats47 の R2 `app/ranking/travel-participation-rate-overnight/values.json`（最新フル 47 県 = 2021年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts travel-participation-rate-overnight`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会生活基本調査（総務省）",
  tableName: "旅行（1泊2日以上）の行動者率",
  statsDataId: "0003456093",
  url: "https://www.stat.go.jp/data/shakai/2021/index.html",
  year: "2021",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2021）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2021）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 旅行（1泊2日以上）の行動者率（2021）。47 県の実データ。 */
export const TRAVEL_PARTICIPATION_RATE_OVERNIGHT_2021: Dataset = normalizeDataset({
  indicator: "旅行（1泊2日以上）の行動者率",
  unit: "％",
  year: "2021",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 34.7 },
    { code: "02000", value: 19.7 },
    { code: "03000", value: 26 },
    { code: "04000", value: 32.2 },
    { code: "05000", value: 23.6 },
    { code: "06000", value: 22.7 },
    { code: "07000", value: 23.1 },
    { code: "08000", value: 25.9 },
    { code: "09000", value: 28.2 },
    { code: "10000", value: 28.8 },
    { code: "11000", value: 34.1 },
    { code: "12000", value: 32.5 },
    { code: "13000", value: 41.9 },
    { code: "14000", value: 38.2 },
    { code: "15000", value: 29.7 },
    { code: "16000", value: 25.1 },
    { code: "17000", value: 28.6 },
    { code: "18000", value: 23.8 },
    { code: "19000", value: 26.9 },
    { code: "20000", value: 28 },
    { code: "21000", value: 27.4 },
    { code: "22000", value: 23.1 },
    { code: "23000", value: 39.9 },
    { code: "24000", value: 28.1 },
    { code: "25000", value: 34.3 },
    { code: "26000", value: 37.7 },
    { code: "27000", value: 35.6 },
    { code: "28000", value: 34.3 },
    { code: "29000", value: 33.6 },
    { code: "30000", value: 26.8 },
    { code: "31000", value: 20.8 },
    { code: "32000", value: 21.2 },
    { code: "33000", value: 24.3 },
    { code: "34000", value: 28.6 },
    { code: "35000", value: 24.2 },
    { code: "36000", value: 16.4 },
    { code: "37000", value: 21.3 },
    { code: "38000", value: 18.1 },
    { code: "39000", value: 21 },
    { code: "40000", value: 36.5 },
    { code: "41000", value: 29.4 },
    { code: "42000", value: 21.6 },
    { code: "43000", value: 29.9 },
    { code: "44000", value: 24.8 },
    { code: "45000", value: 22.2 },
    { code: "46000", value: 23.6 },
    { code: "47000", value: 16.8 },
  ],
});
