/**
 * 実データ スナップショット: 一般世帯数（都道府県別・2020 年）。
 * 出典: 政府統計の総合窓口 (e-Stat) 社会・人口統計体系 (statsDataId 0000010201 / cdCat01 #A06103)。
 * stats47 の R2 `app/ranking/general-households/values.json` (最新フル 47 県 = 2020 年) を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts general-households`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "基礎データ（人口・世帯）一般世帯数 A06103",
  statsDataId: "0000010201",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "万世帯",
  transform: "都道府県別・最新年（2020）の一般世帯数を stats47 が R2 (app/ranking/general-households/values.json) から抽出。値は万世帯単位。",
  notes: "基準年固定（2020・国勢調査年）。e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 一般世帯数（2020）。47 県の実データ。 */
export const GENERAL_HOUSEHOLDS_2020: Dataset = normalizeDataset({
  indicator: "一般世帯数",
  unit: "万世帯",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 247 },
    { code: "02000", value: 51 },
    { code: "03000", value: 49 },
    { code: "04000", value: 98 },
    { code: "05000", value: 38 },
    { code: "06000", value: 40 },
    { code: "07000", value: 74 },
    { code: "08000", value: 118 },
    { code: "09000", value: 80 },
    { code: "10000", value: 80 },
    { code: "11000", value: 316 },
    { code: "12000", value: 277 },
    { code: "13000", value: 722 },
    { code: "14000", value: 421 },
    { code: "15000", value: 86 },
    { code: "16000", value: 40 },
    { code: "17000", value: 47 },
    { code: "18000", value: 29 },
    { code: "19000", value: 34 },
    { code: "20000", value: 83 },
    { code: "21000", value: 78 },
    { code: "22000", value: 148 },
    { code: "23000", value: 323 },
    { code: "24000", value: 74 },
    { code: "25000", value: 57 },
    { code: "26000", value: 119 },
    { code: "27000", value: 413 },
    { code: "28000", value: 240 },
    { code: "29000", value: 54 },
    { code: "30000", value: 39 },
    { code: "31000", value: 22 },
    { code: "32000", value: 27 },
    { code: "33000", value: 80 },
    { code: "34000", value: 124 },
    { code: "35000", value: 60 },
    { code: "36000", value: 31 },
    { code: "37000", value: 41 },
    { code: "38000", value: 60 },
    { code: "39000", value: 31 },
    { code: "40000", value: 232 },
    { code: "41000", value: 31 },
    { code: "42000", value: 56 },
    { code: "43000", value: 72 },
    { code: "44000", value: 49 },
    { code: "45000", value: 47 },
    { code: "46000", value: 73 },
    { code: "47000", value: 61 },
  ],
});
