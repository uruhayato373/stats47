/**
 * 実データ スナップショット: 総面積（北方地域及び竹島を含む）（都道府県別・2023 年）。
 * 出典: 政府統計の総合窓口 (e-Stat) 社会・人口統計体系 (statsDataId 0000010202 / cdCat01 #B011001)。
 * stats47 の R2 `app/ranking/total-area-including-northern-territories-and-takeshima/values.json` (最新フル 47 県 = 2023 年) を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts total-area-including-northern-territories-and-takeshima`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "基礎データ（自然環境）総面積 B011001",
  statsDataId: "0000010202",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "100km²",
  transform: "都道府県別・最新年（2023）の総面積を stats47 が R2 (app/ranking/total-area-including-northern-territories-and-takeshima/values.json) から抽出。値は100km²単位（実km²は×100）。",
  notes: "基準年固定（2023）。北方地域及び竹島を含む。e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 総面積（北方地域及び竹島を含む）（2023）。47 県の実データ。 */
export const TOTAL_AREA_2023: Dataset = normalizeDataset({
  indicator: "総面積（北方地域及び竹島を含む）",
  unit: "100km²",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 834.21 },
    { code: "02000", value: 96.45 },
    { code: "03000", value: 152.75 },
    { code: "04000", value: 72.82 },
    { code: "05000", value: 116.38 },
    { code: "06000", value: 93.23 },
    { code: "07000", value: 137.84 },
    { code: "08000", value: 60.98 },
    { code: "09000", value: 64.08 },
    { code: "10000", value: 63.62 },
    { code: "11000", value: 37.98 },
    { code: "12000", value: 51.57 },
    { code: "13000", value: 22 },
    { code: "14000", value: 24.16 },
    { code: "15000", value: 125.84 },
    { code: "16000", value: 42.48 },
    { code: "17000", value: 41.86 },
    { code: "18000", value: 41.91 },
    { code: "19000", value: 44.65 },
    { code: "20000", value: 135.62 },
    { code: "21000", value: 106.21 },
    { code: "22000", value: 77.77 },
    { code: "23000", value: 51.73 },
    { code: "24000", value: 57.74 },
    { code: "25000", value: 40.17 },
    { code: "26000", value: 46.12 },
    { code: "27000", value: 19.05 },
    { code: "28000", value: 84.01 },
    { code: "29000", value: 36.91 },
    { code: "30000", value: 47.25 },
    { code: "31000", value: 35.07 },
    { code: "32000", value: 67.08 },
    { code: "33000", value: 71.15 },
    { code: "34000", value: 84.79 },
    { code: "35000", value: 61.13 },
    { code: "36000", value: 41.47 },
    { code: "37000", value: 18.77 },
    { code: "38000", value: 56.76 },
    { code: "39000", value: 71.02 },
    { code: "40000", value: 49.88 },
    { code: "41000", value: 24.41 },
    { code: "42000", value: 41.31 },
    { code: "43000", value: 74.09 },
    { code: "44000", value: 63.41 },
    { code: "45000", value: 77.34 },
    { code: "46000", value: 91.86 },
    { code: "47000", value: 22.82 },
  ],
});
