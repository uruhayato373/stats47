/**
 * 実データ スナップショット: 人口1人当たり災害被害額（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010211）。
 * stats47 の R2 `app/ranking/disaster-damage-amount-per-person/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts disaster-damage-amount-per-person`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "災害被害額（人口1人当たり）",
  statsDataId: "0000010211",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "円",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 人口1人当たり災害被害額（2023）。47 県の実データ。 */
export const DISASTER_DAMAGE_AMOUNT_PER_PERSON_2023: Dataset = normalizeDataset({
  indicator: "人口1人当たり災害被害額",
  unit: "円",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1273 },
    { code: "02000", value: 1938 },
    { code: "03000", value: 3521 },
    { code: "04000", value: 207 },
    { code: "05000", value: 53345 },
    { code: "06000", value: 3907 },
    { code: "07000", value: 4824 },
    { code: "08000", value: 3329 },
    { code: "09000", value: 851 },
    { code: "10000", value: 381 },
    { code: "11000", value: 6 },
    { code: "12000", value: 1798 },
    { code: "13000", value: 2 },
    { code: "14000", value: 7 },
    { code: "15000", value: 1441 },
    { code: "16000", value: 18014 },
    { code: "17000", value: 13400 },
    { code: "18000", value: 15513 },
    { code: "19000", value: 947 },
    { code: "20000", value: 8293 },
    { code: "21000", value: 4954 },
    { code: "22000", value: 1041 },
    { code: "23000", value: 982 },
    { code: "24000", value: 2971 },
    { code: "25000", value: 177 },
    { code: "26000", value: 3281 },
    { code: "27000", value: 6 },
    { code: "28000", value: 1702 },
    { code: "29000", value: 1086 },
    { code: "30000", value: 33962 },
    { code: "31000", value: 53734 },
    { code: "32000", value: 4989 },
    { code: "33000", value: 3166 },
    { code: "34000", value: 1147 },
    { code: "35000", value: 23682 },
    { code: "36000", value: 1784 },
    { code: "37000", value: 32 },
    { code: "38000", value: 4544 },
    { code: "39000", value: 6712 },
    { code: "40000", value: 9290 },
    { code: "41000", value: 44423 },
    { code: "42000", value: 1440 },
    { code: "43000", value: 20201 },
    { code: "44000", value: 22248 },
    { code: "45000", value: 10138 },
    { code: "46000", value: 10904 },
    { code: "47000", value: 2489 },
  ],
});
