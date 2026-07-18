/**
 * 実データ スナップショット: 日本人人口 (都道府県別・2024 年)。
 * 出典: 政府統計の総合窓口 (e-Stat) 社会・人口統計体系 (statsDataId 0000010101)。
 * stats47 の R2 `app/ranking/japanese-population/values.json` (最新フル 47 県 = 2024 年) を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts japanese-population`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "基礎データ（人口・世帯）日本人人口",
  statsDataId: "0000010101",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-18",
  unit: "人",
  transform: "都道府県別・最新年（2024）の値を stats47 が抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。e-Stat の数値・表・グラフを基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 日本人人口（2024）。47 県の実データ。 */
export const JAPANESE_POPULATION_2024: Dataset = normalizeDataset({
  indicator: "日本人人口",
  unit: "人",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 4980000 },
    { code: "02000", value: 1157000 },
    { code: "03000", value: 1134000 },
    { code: "04000", value: 2219000 },
    { code: "05000", value: 891000 },
    { code: "06000", value: 1001000 },
    { code: "07000", value: 1724000 },
    { code: "08000", value: 2716000 },
    { code: "09000", value: 1830000 },
    { code: "10000", value: 1811000 },
    { code: "11000", value: 7083000 },
    { code: "12000", value: 6057000 },
    { code: "13000", value: 13463000 },
    { code: "14000", value: 8941000 },
    { code: "15000", value: 2078000 },
    { code: "16000", value: 974000 },
    { code: "17000", value: 1079000 },
    { code: "18000", value: 721000 },
    { code: "19000", value: 769000 },
    { code: "20000", value: 1945000 },
    { code: "21000", value: 1846000 },
    { code: "22000", value: 3411000 },
    { code: "23000", value: 7160000 },
    { code: "24000", value: 1649000 },
    { code: "25000", value: 1360000 },
    { code: "26000", value: 2441000 },
    { code: "27000", value: 8453000 },
    { code: "28000", value: 5204000 },
    { code: "29000", value: 1267000 },
    { code: "30000", value: 871000 },
    { code: "31000", value: 525000 },
    { code: "32000", value: 631000 },
    { code: "33000", value: 1795000 },
    { code: "34000", value: 2655000 },
    { code: "35000", value: 1260000 },
    { code: "36000", value: 678000 },
    { code: "37000", value: 899000 },
    { code: "38000", value: 1259000 },
    { code: "39000", value: 649000 },
    { code: "40000", value: 4989000 },
    { code: "41000", value: 777000 },
    { code: "42000", value: 1237000 },
    { code: "43000", value: 1669000 },
    { code: "44000", value: 1066000 },
    { code: "45000", value: 1021000 },
    { code: "46000", value: 1513000 },
    { code: "47000", value: 1437000 },
  ],
});
