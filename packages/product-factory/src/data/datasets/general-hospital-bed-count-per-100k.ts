/**
 * 実データ スナップショット: 人口10万人当たり一般病院病床数（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010209）。
 * stats47 の R2 `app/ranking/general-hospital-bed-count-per-100k/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts general-hospital-bed-count-per-100k`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "一般病院病床数（人口10万対）",
  statsDataId: "0000010209",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "床",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 人口10万人当たり一般病院病床数（2023）。47 県の実データ。 */
export const GENERAL_HOSPITAL_BED_COUNT_PER_100K_2023: Dataset = normalizeDataset({
  indicator: "人口10万人当たり一般病院病床数",
  unit: "床",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1495.3 },
    { code: "02000", value: 1087.2 },
    { code: "03000", value: 1077 },
    { code: "04000", value: 854.2 },
    { code: "05000", value: 1181.3 },
    { code: "06000", value: 1041.6 },
    { code: "07000", value: 1047.5 },
    { code: "08000", value: 918.1 },
    { code: "09000", value: 909.4 },
    { code: "10000", value: 1047.5 },
    { code: "11000", value: 716 },
    { code: "12000", value: 816.6 },
    { code: "13000", value: 803.2 },
    { code: "14000", value: 675.2 },
    { code: "15000", value: 979.4 },
    { code: "16000", value: 1214.9 },
    { code: "17000", value: 1215.3 },
    { code: "18000", value: 1143.4 },
    { code: "19000", value: 1085.3 },
    { code: "20000", value: 1012.2 },
    { code: "21000", value: 816 },
    { code: "22000", value: 845.9 },
    { code: "23000", value: 752.5 },
    { code: "24000", value: 909.4 },
    { code: "25000", value: 854.4 },
    { code: "26000", value: 1121.6 },
    { code: "27000", value: 1016 },
    { code: "28000", value: 1000 },
    { code: "29000", value: 1133.6 },
    { code: "30000", value: 1218.8 },
    { code: "31000", value: 1363.5 },
    { code: "32000", value: 1200.5 },
    { code: "33000", value: 1192.9 },
    { code: "34000", value: 1074.8 },
    { code: "35000", value: 1436.5 },
    { code: "36000", value: 1424.9 },
    { code: "37000", value: 1201.1 },
    { code: "38000", value: 1290.4 },
    { code: "39000", value: 2056.3 },
    { code: "40000", value: 1313.9 },
    { code: "41000", value: 1447.8 },
    { code: "42000", value: 1433.8 },
    { code: "43000", value: 1417.6 },
    { code: "44000", value: 1312.2 },
    { code: "45000", value: 1282.7 },
    { code: "46000", value: 1553.5 },
    { code: "47000", value: 1052.6 },
  ],
});
