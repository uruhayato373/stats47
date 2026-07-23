/**
 * 実データ スナップショット: 0〜5歳人口10万人当たり認定こども園数（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010205）。
 * stats47 の R2 `app/ranking/certified-childcare-center-count-per-100k-0-5/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts certified-childcare-center-count-per-100k-0-5`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "認定こども園数（0〜5歳人口10万対）",
  statsDataId: "0000010205",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "園",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 0〜5歳人口10万人当たり認定こども園数（2024）。47 県の実データ。 */
export const CERTIFIED_CHILDCARE_CENTER_COUNT_PER_100K_0_5_2024: Dataset = normalizeDataset({
  indicator: "0〜5歳人口10万人当たり認定こども園数",
  unit: "園",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 340.4 },
    { code: "02000", value: 687.1 },
    { code: "03000", value: 360.6 },
    { code: "04000", value: 208.9 },
    { code: "05000", value: 366.1 },
    { code: "06000", value: 299.4 },
    { code: "07000", value: 181.5 },
    { code: "08000", value: 219.9 },
    { code: "09000", value: 200.3 },
    { code: "10000", value: 344.2 },
    { code: "11000", value: 58.7 },
    { code: "12000", value: 101 },
    { code: "13000", value: 31.7 },
    { code: "14000", value: 69.5 },
    { code: "15000", value: 357.8 },
    { code: "16000", value: 377.7 },
    { code: "17000", value: 543 },
    { code: "18000", value: 457.5 },
    { code: "19000", value: 327.7 },
    { code: "20000", value: 177.1 },
    { code: "21000", value: 187.9 },
    { code: "22000", value: 243.2 },
    { code: "23000", value: 91.2 },
    { code: "24000", value: 156 },
    { code: "25000", value: 251.4 },
    { code: "26000", value: 178.5 },
    { code: "27000", value: 222.8 },
    { code: "28000", value: 284.4 },
    { code: "29000", value: 220.8 },
    { code: "30000", value: 239.5 },
    { code: "31000", value: 254.4 },
    { code: "32000", value: 266.6 },
    { code: "33000", value: 237.2 },
    { code: "34000", value: 204.4 },
    { code: "35000", value: 157.5 },
    { code: "36000", value: 301.6 },
    { code: "37000", value: 278.3 },
    { code: "38000", value: 233.6 },
    { code: "39000", value: 170.7 },
    { code: "40000", value: 114.1 },
    { code: "41000", value: 354 },
    { code: "42000", value: 336.5 },
    { code: "43000", value: 230 },
    { code: "44000", value: 399.9 },
    { code: "45000", value: 456.8 },
    { code: "46000", value: 409.7 },
    { code: "47000", value: 254.4 },
  ],
});
