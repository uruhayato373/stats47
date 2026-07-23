/**
 * 実データ スナップショット: ホテル営業施設数（都道府県別・2017年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/number-of-hotel-facilities/values.json`（最新フル 47 県 = 2017年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts number-of-hotel-facilities`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "ホテル営業施設数",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2017",
  retrievedAt: "2026-07-23",
  unit: "施設",
  transform: "都道府県別・基準年（2017）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2017）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** ホテル営業施設数（2017）。47 県の実データ。 */
export const NUMBER_OF_HOTEL_FACILITIES_2017: Dataset = normalizeDataset({
  indicator: "ホテル営業施設数",
  unit: "施設",
  year: "2017",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 702 },
    { code: "02000", value: 140 },
    { code: "03000", value: 175 },
    { code: "04000", value: 268 },
    { code: "05000", value: 91 },
    { code: "06000", value: 133 },
    { code: "07000", value: 264 },
    { code: "08000", value: 293 },
    { code: "09000", value: 168 },
    { code: "10000", value: 227 },
    { code: "11000", value: 374 },
    { code: "12000", value: 190 },
    { code: "13000", value: 718 },
    { code: "14000", value: 338 },
    { code: "15000", value: 294 },
    { code: "16000", value: 99 },
    { code: "17000", value: 134 },
    { code: "18000", value: 76 },
    { code: "19000", value: 128 },
    { code: "20000", value: 509 },
    { code: "21000", value: 210 },
    { code: "22000", value: 380 },
    { code: "23000", value: 301 },
    { code: "24000", value: 99 },
    { code: "25000", value: 132 },
    { code: "26000", value: 269 },
    { code: "27000", value: 498 },
    { code: "28000", value: 434 },
    { code: "29000", value: 66 },
    { code: "30000", value: 103 },
    { code: "31000", value: 60 },
    { code: "32000", value: 68 },
    { code: "33000", value: 167 },
    { code: "34000", value: 190 },
    { code: "35000", value: 90 },
    { code: "36000", value: 45 },
    { code: "37000", value: 132 },
    { code: "38000", value: 170 },
    { code: "39000", value: 88 },
    { code: "40000", value: 418 },
    { code: "41000", value: 58 },
    { code: "42000", value: 84 },
    { code: "43000", value: 133 },
    { code: "44000", value: 175 },
    { code: "45000", value: 139 },
    { code: "46000", value: 176 },
    { code: "47000", value: 396 },
  ],
});
