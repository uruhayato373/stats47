/**
 * 実データ スナップショット: ホテル営業施設客室数（都道府県別・2017年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/number-of-hotel-rooms/values.json`（最新フル 47 県 = 2017年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts number-of-hotel-rooms`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "ホテル営業施設客室数",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2017",
  retrievedAt: "2026-07-23",
  unit: "室",
  transform: "都道府県別・基準年（2017）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2017）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** ホテル営業施設客室数（2017）。47 県の実データ。 */
export const NUMBER_OF_HOTEL_ROOMS_2017: Dataset = normalizeDataset({
  indicator: "ホテル営業施設客室数",
  unit: "室",
  year: "2017",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 66817 },
    { code: "02000", value: 11706 },
    { code: "03000", value: 12264 },
    { code: "04000", value: 23210 },
    { code: "05000", value: 7751 },
    { code: "06000", value: 8306 },
    { code: "07000", value: 18093 },
    { code: "08000", value: 15709 },
    { code: "09000", value: 11506 },
    { code: "10000", value: 12561 },
    { code: "11000", value: 17660 },
    { code: "12000", value: 33706 },
    { code: "13000", value: 110641 },
    { code: "14000", value: 32600 },
    { code: "15000", value: 20282 },
    { code: "16000", value: 8782 },
    { code: "17000", value: 12259 },
    { code: "18000", value: 5194 },
    { code: "19000", value: 8420 },
    { code: "20000", value: 27041 },
    { code: "21000", value: 11927 },
    { code: "22000", value: 29752 },
    { code: "23000", value: 28769 },
    { code: "24000", value: 9482 },
    { code: "25000", value: 9143 },
    { code: "26000", value: 27038 },
    { code: "27000", value: 71193 },
    { code: "28000", value: 29578 },
    { code: "29000", value: 4409 },
    { code: "30000", value: 5924 },
    { code: "31000", value: 4519 },
    { code: "32000", value: 4892 },
    { code: "33000", value: 12533 },
    { code: "34000", value: 18574 },
    { code: "35000", value: 7203 },
    { code: "36000", value: 3195 },
    { code: "37000", value: 7999 },
    { code: "38000", value: 10752 },
    { code: "39000", value: 6222 },
    { code: "40000", value: 42470 },
    { code: "41000", value: 4748 },
    { code: "42000", value: 8120 },
    { code: "43000", value: 9595 },
    { code: "44000", value: 12966 },
    { code: "45000", value: 11308 },
    { code: "46000", value: 14858 },
    { code: "47000", value: 35823 },
  ],
});
