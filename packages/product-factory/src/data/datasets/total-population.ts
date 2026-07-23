/**
 * 実データ スナップショット: 総人口（都道府県別・2024 年）。
 * 出典: 政府統計の総合窓口 (e-Stat) 社会・人口統計体系 (statsDataId 0000010101 / cdCat01 A1101)。
 * stats47 の R2 `app/ranking/total-population/values.json` (最新フル 47 県 = 2024 年) を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts total-population`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "基礎データ（人口・世帯）総人口 A1101",
  statsDataId: "0000010101",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "人",
  transform: "都道府県別・最新年（2024）の総人口を stats47 が R2 (app/ranking/total-population/values.json) から抽出。",
  notes: "基準年固定（2024）。e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 総人口（2024）。47 県の実データ。 */
export const TOTAL_POPULATION_2024: Dataset = normalizeDataset({
  indicator: "総人口",
  unit: "人",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 5043000 },
    { code: "02000", value: 1165000 },
    { code: "03000", value: 1145000 },
    { code: "04000", value: 2248000 },
    { code: "05000", value: 897000 },
    { code: "06000", value: 1011000 },
    { code: "07000", value: 1743000 },
    { code: "08000", value: 2806000 },
    { code: "09000", value: 1885000 },
    { code: "10000", value: 1890000 },
    { code: "11000", value: 7332000 },
    { code: "12000", value: 6251000 },
    { code: "13000", value: 14178000 },
    { code: "14000", value: 9225000 },
    { code: "15000", value: 2099000 },
    { code: "16000", value: 997000 },
    { code: "17000", value: 1098000 },
    { code: "18000", value: 739000 },
    { code: "19000", value: 791000 },
    { code: "20000", value: 1987000 },
    { code: "21000", value: 1916000 },
    { code: "22000", value: 3527000 },
    { code: "23000", value: 7460000 },
    { code: "24000", value: 1711000 },
    { code: "25000", value: 1402000 },
    { code: "26000", value: 2520000 },
    { code: "27000", value: 8757000 },
    { code: "28000", value: 5337000 },
    { code: "29000", value: 1285000 },
    { code: "30000", value: 880000 },
    { code: "31000", value: 531000 },
    { code: "32000", value: 642000 },
    { code: "33000", value: 1831000 },
    { code: "34000", value: 2714000 },
    { code: "35000", value: 1281000 },
    { code: "36000", value: 685000 },
    { code: "37000", value: 917000 },
    { code: "38000", value: 1276000 },
    { code: "39000", value: 656000 },
    { code: "40000", value: 5092000 },
    { code: "41000", value: 788000 },
    { code: "42000", value: 1252000 },
    { code: "43000", value: 1697000 },
    { code: "44000", value: 1085000 },
    { code: "45000", value: 1033000 },
    { code: "46000", value: 1532000 },
    { code: "47000", value: 1466000 },
  ],
});
