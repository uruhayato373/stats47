/**
 * 実データ スナップショット: 工場立地件数（都道府県別・2020年）。
 * 出典: 工場立地動向調査（経済産業省）（statsDataId 0003411426）。
 * stats47 の R2 `app/ranking/factory-establishment-count/values.json`（最新フル 47 県 = 2020年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts factory-establishment-count`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "工場立地動向調査（経済産業省）",
  tableName: "工場立地件数",
  statsDataId: "0003411426",
  url: "https://www.meti.go.jp/statistics/tii/kougai/index.html",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "件",
  transform: "都道府県別・基準年（2020）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2020）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 工場立地件数（2020）。47 県の実データ。 */
export const FACTORY_ESTABLISHMENT_COUNT_2020: Dataset = normalizeDataset({
  indicator: "工場立地件数",
  unit: "件",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 21 },
    { code: "02000", value: 4 },
    { code: "03000", value: 10 },
    { code: "04000", value: 19 },
    { code: "05000", value: 8 },
    { code: "06000", value: 20 },
    { code: "07000", value: 15 },
    { code: "08000", value: 65 },
    { code: "09000", value: 36 },
    { code: "10000", value: 52 },
    { code: "11000", value: 22 },
    { code: "12000", value: 15 },
    { code: "13000", value: 1 },
    { code: "14000", value: 14 },
    { code: "15000", value: 28 },
    { code: "16000", value: 18 },
    { code: "17000", value: 5 },
    { code: "18000", value: 6 },
    { code: "19000", value: 9 },
    { code: "20000", value: 20 },
    { code: "21000", value: 46 },
    { code: "22000", value: 54 },
    { code: "23000", value: 60 },
    { code: "24000", value: 28 },
    { code: "25000", value: 19 },
    { code: "26000", value: 16 },
    { code: "27000", value: 15 },
    { code: "28000", value: 39 },
    { code: "29000", value: 26 },
    { code: "30000", value: 7 },
    { code: "31000", value: 2 },
    { code: "32000", value: 1 },
    { code: "33000", value: 12 },
    { code: "34000", value: 10 },
    { code: "35000", value: 10 },
    { code: "36000", value: 10 },
    { code: "37000", value: 12 },
    { code: "38000", value: 12 },
    { code: "39000", value: 3 },
    { code: "40000", value: 27 },
    { code: "41000", value: 3 },
    { code: "42000", value: 1 },
    { code: "43000", value: 7 },
    { code: "44000", value: 2 },
    { code: "45000", value: 3 },
    { code: "46000", value: 15 },
    { code: "47000", value: 3 },
  ],
});
