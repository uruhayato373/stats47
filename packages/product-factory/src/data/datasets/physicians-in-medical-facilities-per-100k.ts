/**
 * 実データ スナップショット: 人口10万人当たり医師数（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010209）。
 * stats47 の R2 `app/ranking/physicians-in-medical-facilities-per-100k/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts physicians-in-medical-facilities-per-100k`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "医師数（人口10万対）",
  statsDataId: "0000010209",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "人",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 人口10万人当たり医師数（2022）。47 県の実データ。 */
export const PHYSICIANS_IN_MEDICAL_FACILITIES_PER_100K_2022: Dataset = normalizeDataset({
  indicator: "人口10万人当たり医師数",
  unit: "人",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 254 },
    { code: "02000", value: 220.2 },
    { code: "03000", value: 218.5 },
    { code: "04000", value: 256.3 },
    { code: "05000", value: 249.8 },
    { code: "06000", value: 239.6 },
    { code: "07000", value: 218.7 },
    { code: "08000", value: 202 },
    { code: "09000", value: 248.4 },
    { code: "10000", value: 233.4 },
    { code: "11000", value: 180.2 },
    { code: "12000", value: 209 },
    { code: "13000", value: 324.6 },
    { code: "14000", value: 223 },
    { code: "15000", value: 212.8 },
    { code: "16000", value: 270.6 },
    { code: "17000", value: 286.4 },
    { code: "18000", value: 271.2 },
    { code: "19000", value: 257.9 },
    { code: "20000", value: 249.8 },
    { code: "21000", value: 231.5 },
    { code: "22000", value: 230.1 },
    { code: "23000", value: 234.7 },
    { code: "24000", value: 241.2 },
    { code: "25000", value: 242.2 },
    { code: "26000", value: 334.3 },
    { code: "27000", value: 288.5 },
    { code: "28000", value: 276.5 },
    { code: "29000", value: 286.8 },
    { code: "30000", value: 320.9 },
    { code: "31000", value: 319.9 },
    { code: "32000", value: 307.6 },
    { code: "33000", value: 324 },
    { code: "34000", value: 272.6 },
    { code: "35000", value: 267.2 },
    { code: "36000", value: 335.7 },
    { code: "37000", value: 290.5 },
    { code: "38000", value: 286.3 },
    { code: "39000", value: 335.2 },
    { code: "40000", value: 312.1 },
    { code: "41000", value: 293.6 },
    { code: "42000", value: 327.6 },
    { code: "43000", value: 302.2 },
    { code: "44000", value: 297.9 },
    { code: "45000", value: 260.8 },
    { code: "46000", value: 288.7 },
    { code: "47000", value: 266.1 },
  ],
});
