/**
 * 実データ スナップショット: ラスパイレス指数（都道府県別・2025年）。
 * 出典: 地方公務員給与実態調査（総務省）。
 * stats47 の R2 `app/ranking/laspeyres-index-prefecture/values.json`（最新フル 47 県 = 2025年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts laspeyres-index-prefecture`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "地方公務員給与実態調査（総務省）",
  tableName: "ラスパイレス指数",
  statsDataId: "-",
  url: "https://www.soumu.go.jp/iken/kyuyo.html",
  year: "2025",
  retrievedAt: "2026-07-23",
  unit: "指数",
  transform: "都道府県別・基準年（2025）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2025）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** ラスパイレス指数（2025）。47 県の実データ。 */
export const LASPEYRES_INDEX_PREFECTURE_2025: Dataset = normalizeDataset({
  indicator: "ラスパイレス指数",
  unit: "指数",
  year: "2025",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 99.2 },
    { code: "02000", value: 96.8 },
    { code: "03000", value: 99.6 },
    { code: "04000", value: 100.1 },
    { code: "05000", value: 100.2 },
    { code: "06000", value: 99.8 },
    { code: "07000", value: 100.2 },
    { code: "08000", value: 100.3 },
    { code: "09000", value: 99.4 },
    { code: "10000", value: 100 },
    { code: "11000", value: 100 },
    { code: "12000", value: 99.6 },
    { code: "13000", value: 100.5 },
    { code: "14000", value: 99.5 },
    { code: "15000", value: 99.2 },
    { code: "16000", value: 99.4 },
    { code: "17000", value: 97.8 },
    { code: "18000", value: 99.4 },
    { code: "19000", value: 100.2 },
    { code: "20000", value: 100 },
    { code: "21000", value: 99.4 },
    { code: "22000", value: 101.8 },
    { code: "23000", value: 101 },
    { code: "24000", value: 100.9 },
    { code: "25000", value: 99.8 },
    { code: "26000", value: 99.5 },
    { code: "27000", value: 100.4 },
    { code: "28000", value: 99.4 },
    { code: "29000", value: 99.2 },
    { code: "30000", value: 99.7 },
    { code: "31000", value: 97.1 },
    { code: "32000", value: 98.2 },
    { code: "33000", value: 100.8 },
    { code: "34000", value: 100.9 },
    { code: "35000", value: 99.5 },
    { code: "36000", value: 99.2 },
    { code: "37000", value: 99.6 },
    { code: "38000", value: 98.6 },
    { code: "39000", value: 98.8 },
    { code: "40000", value: 100.1 },
    { code: "41000", value: 99.8 },
    { code: "42000", value: 98.6 },
    { code: "43000", value: 99.4 },
    { code: "44000", value: 100.1 },
    { code: "45000", value: 97.6 },
    { code: "46000", value: 96.9 },
    { code: "47000", value: 97.9 },
  ],
});
