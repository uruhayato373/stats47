/**
 * 実データ スナップショット: 観光資源数（都道府県別・2014年）。
 * 出典: 国土数値情報（国土交通省）。
 * stats47 の R2 `app/ranking/tourism-resource-count/values.json`（最新フル 47 県 = 2014年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts tourism-resource-count`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "国土数値情報（国土交通省）",
  tableName: "観光資源",
  statsDataId: "-",
  url: "https://nlftp.mlit.go.jp/ksj/index.html",
  year: "2014",
  retrievedAt: "2026-07-23",
  unit: "件",
  transform: "都道府県別・基準年（2014）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2014）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 観光資源数（2014）。47 県の実データ。 */
export const TOURISM_RESOURCE_COUNT_2014: Dataset = normalizeDataset({
  indicator: "観光資源数",
  unit: "件",
  year: "2014",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 47 },
    { code: "02000", value: 52 },
    { code: "03000", value: 37 },
    { code: "04000", value: 9 },
    { code: "05000", value: 51 },
    { code: "06000", value: 13 },
    { code: "07000", value: 9 },
    { code: "08000", value: 246 },
    { code: "09000", value: 48 },
    { code: "10000", value: 75 },
    { code: "11000", value: 72 },
    { code: "12000", value: 58 },
    { code: "13000", value: 38 },
    { code: "14000", value: 37 },
    { code: "15000", value: 114 },
    { code: "16000", value: 37 },
    { code: "17000", value: 50 },
    { code: "18000", value: 12 },
    { code: "19000", value: 27 },
    { code: "20000", value: 48 },
    { code: "21000", value: 57 },
    { code: "22000", value: 75 },
    { code: "23000", value: 29 },
    { code: "24000", value: 40 },
    { code: "25000", value: 66 },
    { code: "26000", value: 72 },
    { code: "27000", value: 34 },
    { code: "28000", value: 75 },
    { code: "29000", value: 111 },
    { code: "30000", value: 49 },
    { code: "31000", value: 184 },
    { code: "32000", value: 118 },
    { code: "33000", value: 60 },
    { code: "34000", value: 28 },
    { code: "35000", value: 38 },
    { code: "36000", value: 32 },
    { code: "37000", value: 12 },
    { code: "38000", value: 66 },
    { code: "39000", value: 24 },
    { code: "40000", value: 389 },
    { code: "41000", value: 366 },
    { code: "42000", value: 36 },
    { code: "43000", value: 71 },
    { code: "44000", value: 93 },
    { code: "45000", value: 219 },
    { code: "46000", value: 9 },
    { code: "47000", value: 38 },
  ],
});
