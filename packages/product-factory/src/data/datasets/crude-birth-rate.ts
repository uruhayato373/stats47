/**
 * 実データ スナップショット: 粗出生率（人口千対）（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010201）。
 * stats47 の R2 `app/ranking/crude-birth-rate/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts crude-birth-rate`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "出生率（人口千対）",
  statsDataId: "0000010201",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "人口千対",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 粗出生率（人口千対）（2023）。47 県の実データ。 */
export const CRUDE_BIRTH_RATE_2023: Dataset = normalizeDataset({
  indicator: "粗出生率（人口千対）",
  unit: "人口千対",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 4.8 },
    { code: "02000", value: 4.81 },
    { code: "03000", value: 4.67 },
    { code: "04000", value: 5.45 },
    { code: "05000", value: 3.95 },
    { code: "06000", value: 5.02 },
    { code: "07000", value: 5.1 },
    { code: "08000", value: 5.27 },
    { code: "09000", value: 5.25 },
    { code: "10000", value: 5.23 },
    { code: "11000", value: 5.74 },
    { code: "12000", value: 5.7 },
    { code: "13000", value: 6.13 },
    { code: "14000", value: 5.85 },
    { code: "15000", value: 5.13 },
    { code: "16000", value: 5.47 },
    { code: "17000", value: 6.09 },
    { code: "18000", value: 6.13 },
    { code: "19000", value: 5.52 },
    { code: "20000", value: 5.55 },
    { code: "21000", value: 5.42 },
    { code: "22000", value: 5.34 },
    { code: "23000", value: 6.47 },
    { code: "24000", value: 5.51 },
    { code: "25000", value: 6.57 },
    { code: "26000", value: 5.48 },
    { code: "27000", value: 6.31 },
    { code: "28000", value: 6.07 },
    { code: "29000", value: 5.36 },
    { code: "30000", value: 5.49 },
    { code: "31000", value: 6.08 },
    { code: "32000", value: 5.78 },
    { code: "33000", value: 6.27 },
    { code: "34000", value: 6.09 },
    { code: "35000", value: 5.54 },
    { code: "36000", value: 5.62 },
    { code: "37000", value: 5.79 },
    { code: "38000", value: 5.38 },
    { code: "39000", value: 5.08 },
    { code: "40000", value: 6.65 },
    { code: "41000", value: 6.47 },
    { code: "42000", value: 6.04 },
    { code: "43000", value: 6.55 },
    { code: "44000", value: 5.71 },
    { code: "45000", value: 6.24 },
    { code: "46000", value: 6.37 },
    { code: "47000", value: 8.55 },
  ],
});
