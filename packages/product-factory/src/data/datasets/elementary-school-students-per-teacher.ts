/**
 * 実データ スナップショット: 小学校教員1人当たり児童数（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010205）。
 * stats47 の R2 `app/ranking/elementary-school-students-per-teacher/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts elementary-school-students-per-teacher`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "小学校教員1人当たり児童数",
  statsDataId: "0000010205",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "人",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 小学校教員1人当たり児童数（2024）。47 県の実データ。 */
export const ELEMENTARY_SCHOOL_STUDENTS_PER_TEACHER_2024: Dataset = normalizeDataset({
  indicator: "小学校教員1人当たり児童数",
  unit: "人",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 11.57 },
    { code: "02000", value: 11.92 },
    { code: "03000", value: 11.73 },
    { code: "04000", value: 13.4 },
    { code: "05000", value: 12.1 },
    { code: "06000", value: 12.02 },
    { code: "07000", value: 12.73 },
    { code: "08000", value: 13.39 },
    { code: "09000", value: 13.32 },
    { code: "10000", value: 13.09 },
    { code: "11000", value: 16.08 },
    { code: "12000", value: 15.77 },
    { code: "13000", value: 16.79 },
    { code: "14000", value: 16.05 },
    { code: "15000", value: 12.07 },
    { code: "16000", value: 12.49 },
    { code: "17000", value: 13.56 },
    { code: "18000", value: 11.77 },
    { code: "19000", value: 11.25 },
    { code: "20000", value: 13.46 },
    { code: "21000", value: 13.24 },
    { code: "22000", value: 15.2 },
    { code: "23000", value: 15.05 },
    { code: "24000", value: 12.5 },
    { code: "25000", value: 13.47 },
    { code: "26000", value: 13.57 },
    { code: "27000", value: 13.75 },
    { code: "28000", value: 14.26 },
    { code: "29000", value: 12.75 },
    { code: "30000", value: 10.34 },
    { code: "31000", value: 11.67 },
    { code: "32000", value: 10.63 },
    { code: "33000", value: 12.57 },
    { code: "34000", value: 13.75 },
    { code: "35000", value: 12.33 },
    { code: "36000", value: 11 },
    { code: "37000", value: 13.25 },
    { code: "38000", value: 13.18 },
    { code: "39000", value: 10.56 },
    { code: "40000", value: 14.82 },
    { code: "41000", value: 11.84 },
    { code: "42000", value: 12.05 },
    { code: "43000", value: 13.42 },
    { code: "44000", value: 12.55 },
    { code: "45000", value: 13.01 },
    { code: "46000", value: 11.25 },
    { code: "47000", value: 14.8 },
  ],
});
