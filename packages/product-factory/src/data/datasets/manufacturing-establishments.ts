/**
 * 実データ スナップショット: 製造業事業所数（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/manufacturing-establishments/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts manufacturing-establishments`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "製造業事業所数",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "事業所",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 製造業事業所数（2024）。47 県の実データ。 */
export const MANUFACTURING_ESTABLISHMENTS_2024: Dataset = normalizeDataset({
  indicator: "製造業事業所数",
  unit: "事業所",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 6397 },
    { code: "02000", value: 1489 },
    { code: "03000", value: 2114 },
    { code: "04000", value: 3102 },
    { code: "05000", value: 1766 },
    { code: "06000", value: 2700 },
    { code: "07000", value: 3894 },
    { code: "08000", value: 5689 },
    { code: "09000", value: 4857 },
    { code: "10000", value: 5696 },
    { code: "11000", value: 13159 },
    { code: "12000", value: 5921 },
    { code: "13000", value: 15297 },
    { code: "14000", value: 9856 },
    { code: "15000", value: 5767 },
    { code: "16000", value: 2931 },
    { code: "17000", value: 3187 },
    { code: "18000", value: 2553 },
    { code: "19000", value: 2109 },
    { code: "20000", value: 6128 },
    { code: "21000", value: 6488 },
    { code: "22000", value: 10530 },
    { code: "23000", value: 18414 },
    { code: "24000", value: 3857 },
    { code: "25000", value: 3107 },
    { code: "26000", value: 5297 },
    { code: "27000", value: 18481 },
    { code: "28000", value: 8572 },
    { code: "29000", value: 1880 },
    { code: "30000", value: 1747 },
    { code: "31000", value: 854 },
    { code: "32000", value: 1206 },
    { code: "33000", value: 3921 },
    { code: "34000", value: 5871 },
    { code: "35000", value: 1983 },
    { code: "36000", value: 1294 },
    { code: "37000", value: 2354 },
    { code: "38000", value: 2592 },
    { code: "39000", value: 1091 },
    { code: "40000", value: 6022 },
    { code: "41000", value: 1436 },
    { code: "42000", value: 1646 },
    { code: "43000", value: 2235 },
    { code: "44000", value: 1664 },
    { code: "45000", value: 1533 },
    { code: "46000", value: 2533 },
    { code: "47000", value: 980 },
  ],
});
