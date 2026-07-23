/**
 * 実データ スナップショット: 老年化指数（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010201）。
 * stats47 の R2 `app/ranking/aging-index/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts aging-index`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "老年化指数",
  statsDataId: "0000010201",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "指数",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 老年化指数（2022）。47 県の実データ。 */
export const AGING_INDEX_2022: Dataset = normalizeDataset({
  indicator: "老年化指数",
  unit: "指数",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 318.1 },
    { code: "02000", value: 340.7 },
    { code: "03000", value: 326.4 },
    { code: "04000", value: 255.4 },
    { code: "05000", value: 417.4 },
    { code: "06000", value: 320.4 },
    { code: "07000", value: 297.5 },
    { code: "08000", value: 269.2 },
    { code: "09000", value: 263.6 },
    { code: "10000", value: 272.7 },
    { code: "11000", value: 237 },
    { code: "12000", value: 244.5 },
    { code: "13000", value: 208.6 },
    { code: "14000", value: 226.3 },
    { code: "15000", value: 307.2 },
    { code: "16000", value: 301.8 },
    { code: "17000", value: 256.1 },
    { code: "18000", value: 255.4 },
    { code: "19000", value: 283.1 },
    { code: "20000", value: 279.6 },
    { code: "21000", value: 261.5 },
    { code: "22000", value: 264 },
    { code: "23000", value: 202.5 },
    { code: "24000", value: 260.3 },
    { code: "25000", value: 203.2 },
    { code: "26000", value: 267.7 },
    { code: "27000", value: 242.7 },
    { code: "28000", value: 249.7 },
    { code: "29000", value: 285.8 },
    { code: "30000", value: 304 },
    { code: "31000", value: 272.7 },
    { code: "32000", value: 289.9 },
    { code: "33000", value: 255.1 },
    { code: "34000", value: 242.9 },
    { code: "35000", value: 314.3 },
    { code: "36000", value: 328 },
    { code: "37000", value: 274.5 },
    { code: "38000", value: 301.4 },
    { code: "39000", value: 338.9 },
    { code: "40000", value: 221.6 },
    { code: "41000", value: 239 },
    { code: "42000", value: 275.3 },
    { code: "43000", value: 247.5 },
    { code: "44000", value: 287 },
    { code: "45000", value: 258.8 },
    { code: "46000", value: 260.2 },
    { code: "47000", value: 143.3 },
  ],
});
