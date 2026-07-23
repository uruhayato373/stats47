/**
 * 実データ スナップショット: 人口10万人当たりコンビニエンスストア数（都道府県別・2014年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010208）。
 * stats47 の R2 `app/ranking/convenience-store-count-per-100k/values.json`（最新フル 47 県 = 2014年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts convenience-store-count-per-100k`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "コンビニエンスストア数（人口10万対）",
  statsDataId: "0000010208",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2014",
  retrievedAt: "2026-07-23",
  unit: "所",
  transform: "都道府県別・基準年（2014）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2014）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 人口10万人当たりコンビニエンスストア数（2014）。47 県の実データ。 */
export const CONVENIENCE_STORE_COUNT_PER_100K_2014: Dataset = normalizeDataset({
  indicator: "人口10万人当たりコンビニエンスストア数",
  unit: "所",
  year: "2014",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 40.6 },
    { code: "02000", value: 30.5 },
    { code: "03000", value: 30.9 },
    { code: "04000", value: 33.3 },
    { code: "05000", value: 29.8 },
    { code: "06000", value: 30.3 },
    { code: "07000", value: 24.8 },
    { code: "08000", value: 30.7 },
    { code: "09000", value: 30.7 },
    { code: "10000", value: 30.6 },
    { code: "11000", value: 23 },
    { code: "12000", value: 27.3 },
    { code: "13000", value: 32.2 },
    { code: "14000", value: 26.1 },
    { code: "15000", value: 29.3 },
    { code: "16000", value: 29.3 },
    { code: "17000", value: 28.9 },
    { code: "18000", value: 30.1 },
    { code: "19000", value: 33.3 },
    { code: "20000", value: 27.8 },
    { code: "21000", value: 26.8 },
    { code: "22000", value: 29.9 },
    { code: "23000", value: 29.5 },
    { code: "24000", value: 25.1 },
    { code: "25000", value: 23.1 },
    { code: "26000", value: 24.9 },
    { code: "27000", value: 21.2 },
    { code: "28000", value: 21.4 },
    { code: "29000", value: 17.1 },
    { code: "30000", value: 21.8 },
    { code: "31000", value: 26.7 },
    { code: "32000", value: 27 },
    { code: "33000", value: 25 },
    { code: "34000", value: 26.5 },
    { code: "35000", value: 27.6 },
    { code: "36000", value: 21.5 },
    { code: "37000", value: 21 },
    { code: "38000", value: 24.6 },
    { code: "39000", value: 24.9 },
    { code: "40000", value: 27.1 },
    { code: "41000", value: 30 },
    { code: "42000", value: 24.9 },
    { code: "43000", value: 27.6 },
    { code: "44000", value: 26.9 },
    { code: "45000", value: 26.5 },
    { code: "46000", value: 26.9 },
    { code: "47000", value: 27 },
  ],
});
