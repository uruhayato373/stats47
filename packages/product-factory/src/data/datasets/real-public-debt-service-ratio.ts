/**
 * 実データ スナップショット: 実質公債費比率（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010104）。
 * stats47 の R2 `app/ranking/real-public-debt-service-ratio/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts real-public-debt-service-ratio`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "実質公債費比率",
  statsDataId: "0000010104",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 実質公債費比率（2022）。47 県の実データ。 */
export const REAL_PUBLIC_DEBT_SERVICE_RATIO_2022: Dataset = normalizeDataset({
  indicator: "実質公債費比率",
  unit: "％",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 18.9 },
    { code: "02000", value: 13.1 },
    { code: "03000", value: 12.8 },
    { code: "04000", value: 10.6 },
    { code: "05000", value: 15.3 },
    { code: "06000", value: 12.3 },
    { code: "07000", value: 6.7 },
    { code: "08000", value: 9.3 },
    { code: "09000", value: 9.5 },
    { code: "10000", value: 9.4 },
    { code: "11000", value: 10.7 },
    { code: "12000", value: 7.8 },
    { code: "13000", value: 1.2 },
    { code: "14000", value: 9.4 },
    { code: "15000", value: 18.2 },
    { code: "16000", value: 13.8 },
    { code: "17000", value: 12.5 },
    { code: "18000", value: 11.8 },
    { code: "19000", value: 11.5 },
    { code: "20000", value: 9.7 },
    { code: "21000", value: 7.2 },
    { code: "22000", value: 13 },
    { code: "23000", value: 13.2 },
    { code: "24000", value: 12.1 },
    { code: "25000", value: 10.9 },
    { code: "26000", value: 16.5 },
    { code: "27000", value: 11.5 },
    { code: "28000", value: 15.5 },
    { code: "29000", value: 9.5 },
    { code: "30000", value: 8.4 },
    { code: "31000", value: 8.9 },
    { code: "32000", value: 6.4 },
    { code: "33000", value: 11 },
    { code: "34000", value: 13.7 },
    { code: "35000", value: 8.5 },
    { code: "36000", value: 11.8 },
    { code: "37000", value: 9.9 },
    { code: "38000", value: 11.1 },
    { code: "39000", value: 11.1 },
    { code: "40000", value: 11.2 },
    { code: "41000", value: 8.9 },
    { code: "42000", value: 10.3 },
    { code: "43000", value: 7.8 },
    { code: "44000", value: 9.1 },
    { code: "45000", value: 11.4 },
    { code: "46000", value: 11.4 },
    { code: "47000", value: 7.3 },
  ],
});
