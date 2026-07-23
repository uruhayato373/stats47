/**
 * 実データ スナップショット: 製造業従業者数（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/manufacturing-employees/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts manufacturing-employees`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "製造業従業者数",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "人",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 製造業従業者数（2024）。47 県の実データ。 */
export const MANUFACTURING_EMPLOYEES_2024: Dataset = normalizeDataset({
  indicator: "製造業従業者数",
  unit: "人",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 165503 },
    { code: "02000", value: 55565 },
    { code: "03000", value: 86083 },
    { code: "04000", value: 114979 },
    { code: "05000", value: 61333 },
    { code: "06000", value: 97681 },
    { code: "07000", value: 152760 },
    { code: "08000", value: 275558 },
    { code: "09000", value: 197935 },
    { code: "10000", value: 218386 },
    { code: "11000", value: 385901 },
    { code: "12000", value: 211434 },
    { code: "13000", value: 265946 },
    { code: "14000", value: 361006 },
    { code: "15000", value: 178649 },
    { code: "16000", value: 122482 },
    { code: "17000", value: 98620 },
    { code: "18000", value: 75549 },
    { code: "19000", value: 72692 },
    { code: "20000", value: 205903 },
    { code: "21000", value: 206982 },
    { code: "22000", value: 408750 },
    { code: "23000", value: 845283 },
    { code: "24000", value: 205046 },
    { code: "25000", value: 172367 },
    { code: "26000", value: 148062 },
    { code: "27000", value: 446661 },
    { code: "28000", value: 364089 },
    { code: "29000", value: 60748 },
    { code: "30000", value: 52520 },
    { code: "31000", value: 31098 },
    { code: "32000", value: 42265 },
    { code: "33000", value: 149176 },
    { code: "34000", value: 214305 },
    { code: "35000", value: 97787 },
    { code: "36000", value: 48337 },
    { code: "37000", value: 72409 },
    { code: "38000", value: 81639 },
    { code: "39000", value: 23543 },
    { code: "40000", value: 229749 },
    { code: "41000", value: 63554 },
    { code: "42000", value: 54902 },
    { code: "43000", value: 93807 },
    { code: "44000", value: 65749 },
    { code: "45000", value: 55059 },
    { code: "46000", value: 72938 },
    { code: "47000", value: 23683 },
  ],
});
