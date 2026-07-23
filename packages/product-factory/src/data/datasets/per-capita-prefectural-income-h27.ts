/**
 * 実データ スナップショット: 1人当たり県民所得（H27年基準）（都道府県別・2020 年）。
 * 出典: 政府統計の総合窓口 (e-Stat) 社会・人口統計体系 (statsDataId 0000010203 / cdCat01 #C01321)。
 * stats47 の R2 `app/ranking/per-capita-prefectural-income-h27/values.json` (最新フル 47 県 = 2020 年) を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts per-capita-prefectural-income-h27`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat／原典 内閣府 県民経済計算年報）",
  tableName: "基礎データ（経済基盤）1人当たり県民所得 C01321",
  statsDataId: "0000010203",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "千円",
  transform: "都道府県別・最新年（2020）の1人当たり県民所得（H27年基準）を stats47 が R2 (app/ranking/per-capita-prefectural-income-h27/values.json) から抽出。値は千円単位。",
  notes: "基準年固定（2020年度）。H27年基準。原典は内閣府 県民経済計算年報。e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 1人当たり県民所得（H27年基準）（2020）。47 県の実データ。 */
export const PER_CAPITA_PREFECTURAL_INCOME_2020: Dataset = normalizeDataset({
  indicator: "1人当たり県民所得（H27年基準）",
  unit: "千円",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 2682 },
    { code: "02000", value: 2633 },
    { code: "03000", value: 2666 },
    { code: "04000", value: 2803 },
    { code: "05000", value: 2583 },
    { code: "06000", value: 2843 },
    { code: "07000", value: 2833 },
    { code: "08000", value: 3098 },
    { code: "09000", value: 3132 },
    { code: "10000", value: 2937 },
    { code: "11000", value: 2890 },
    { code: "12000", value: 2988 },
    { code: "13000", value: 5214 },
    { code: "14000", value: 2961 },
    { code: "15000", value: 2784 },
    { code: "16000", value: 3120 },
    { code: "17000", value: 2770 },
    { code: "18000", value: 3182 },
    { code: "19000", value: 2982 },
    { code: "20000", value: 2788 },
    { code: "21000", value: 2875 },
    { code: "22000", value: 3110 },
    { code: "23000", value: 3428 },
    { code: "24000", value: 2948 },
    { code: "25000", value: 3097 },
    { code: "26000", value: 2745 },
    { code: "27000", value: 2830 },
    { code: "28000", value: 2887 },
    { code: "29000", value: 2501 },
    { code: "30000", value: 2751 },
    { code: "31000", value: 2313 },
    { code: "32000", value: 2768 },
    { code: "33000", value: 2665 },
    { code: "34000", value: 2969 },
    { code: "35000", value: 2960 },
    { code: "36000", value: 3013 },
    { code: "37000", value: 2766 },
    { code: "38000", value: 2471 },
    { code: "39000", value: 2491 },
    { code: "40000", value: 2630 },
    { code: "41000", value: 2575 },
    { code: "42000", value: 2483 },
    { code: "43000", value: 2498 },
    { code: "44000", value: 2604 },
    { code: "45000", value: 2289 },
    { code: "46000", value: 2408 },
    { code: "47000", value: 2167 },
  ],
});
