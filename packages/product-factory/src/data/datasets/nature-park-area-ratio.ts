/**
 * 実データ スナップショット: 自然公園面積割合（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010202）。
 * stats47 の R2 `app/ranking/nature-park-area-ratio/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts nature-park-area-ratio`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "自然公園面積割合",
  statsDataId: "0000010202",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "％",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 自然公園面積割合（2024）。47 県の実データ。 */
export const NATURE_PARK_AREA_RATIO_2024: Dataset = normalizeDataset({
  indicator: "自然公園面積割合",
  unit: "％",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 13 },
    { code: "02000", value: 11.6 },
    { code: "03000", value: 4.7 },
    { code: "04000", value: 23.5 },
    { code: "05000", value: 10.8 },
    { code: "06000", value: 16.7 },
    { code: "07000", value: 13.1 },
    { code: "08000", value: 14.9 },
    { code: "09000", value: 20.8 },
    { code: "10000", value: 14.2 },
    { code: "11000", value: 32.8 },
    { code: "12000", value: 5.5 },
    { code: "13000", value: 36.3 },
    { code: "14000", value: 22.8 },
    { code: "15000", value: 25.2 },
    { code: "16000", value: 29.6 },
    { code: "17000", value: 12.6 },
    { code: "18000", value: 14.8 },
    { code: "19000", value: 27.1 },
    { code: "20000", value: 20.5 },
    { code: "21000", value: 18.4 },
    { code: "22000", value: 10.8 },
    { code: "23000", value: 17.2 },
    { code: "24000", value: 36.1 },
    { code: "25000", value: 37.3 },
    { code: "26000", value: 20.6 },
    { code: "27000", value: 10.5 },
    { code: "28000", value: 19.8 },
    { code: "29000", value: 17.2 },
    { code: "30000", value: 12.8 },
    { code: "31000", value: 14 },
    { code: "32000", value: 6 },
    { code: "33000", value: 11.3 },
    { code: "34000", value: 4.5 },
    { code: "35000", value: 7 },
    { code: "36000", value: 9.3 },
    { code: "37000", value: 10.9 },
    { code: "38000", value: 7.2 },
    { code: "39000", value: 6.7 },
    { code: "40000", value: 17.7 },
    { code: "41000", value: 11 },
    { code: "42000", value: 17.9 },
    { code: "43000", value: 21.4 },
    { code: "44000", value: 27.6 },
    { code: "45000", value: 11.9 },
    { code: "46000", value: 13.9 },
    { code: "47000", value: 35.7 },
  ],
});
