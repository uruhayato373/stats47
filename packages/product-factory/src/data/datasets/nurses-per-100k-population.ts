/**
 * 実データ スナップショット: 人口10万人当たり看護師数（都道府県別・2020年）。
 * 出典: 衛生行政報告例（厚生労働省）（statsDataId 0004026841）。
 * stats47 の R2 `app/ranking/nurses-per-100k-population/values.json`（最新フル 47 県 = 2020年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts nurses-per-100k-population`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "衛生行政報告例（厚生労働省）",
  tableName: "就業看護師数（人口10万対）",
  statsDataId: "0004026841",
  url: "https://www.mhlw.go.jp/toukei/list/36-19.html",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "人",
  transform: "都道府県別・基準年（2020）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2020）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 人口10万人当たり看護師数（2020）。47 県の実データ。 */
export const NURSES_PER_100K_POPULATION_2020: Dataset = normalizeDataset({
  indicator: "人口10万人当たり看護師数",
  unit: "人",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1277.3 },
    { code: "02000", value: 1067.1 },
    { code: "03000", value: 1150.1 },
    { code: "04000", value: 907.6 },
    { code: "05000", value: 1204.2 },
    { code: "06000", value: 1129.8 },
    { code: "07000", value: 963 },
    { code: "08000", value: 820.5 },
    { code: "09000", value: 915.7 },
    { code: "10000", value: 1025.2 },
    { code: "11000", value: 736.9 },
    { code: "12000", value: 770 },
    { code: "13000", value: 854.6 },
    { code: "14000", value: 791.8 },
    { code: "15000", value: 1062.6 },
    { code: "16000", value: 1263.5 },
    { code: "17000", value: 1326 },
    { code: "18000", value: 1201.8 },
    { code: "19000", value: 1045.7 },
    { code: "20000", value: 1143.7 },
    { code: "21000", value: 946.3 },
    { code: "22000", value: 950.6 },
    { code: "23000", value: 860.8 },
    { code: "24000", value: 1009.2 },
    { code: "25000", value: 1026.6 },
    { code: "26000", value: 1107.6 },
    { code: "27000", value: 959.8 },
    { code: "28000", value: 1052.5 },
    { code: "29000", value: 1034.5 },
    { code: "30000", value: 1220.4 },
    { code: "31000", value: 1365.4 },
    { code: "32000", value: 1353.4 },
    { code: "33000", value: 1283.6 },
    { code: "34000", value: 1168.1 },
    { code: "35000", value: 1335.2 },
    { code: "36000", value: 1291.8 },
    { code: "37000", value: 1250 },
    { code: "38000", value: 1293 },
    { code: "39000", value: 1623.4 },
    { code: "40000", value: 1248 },
    { code: "41000", value: 1403.6 },
    { code: "42000", value: 1396.7 },
    { code: "43000", value: 1386.2 },
    { code: "44000", value: 1339.6 },
    { code: "45000", value: 1367.9 },
    { code: "46000", value: 1476 },
    { code: "47000", value: 1149 },
  ],
});
