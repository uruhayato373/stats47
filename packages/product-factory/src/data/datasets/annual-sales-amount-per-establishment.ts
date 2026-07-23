/**
 * 実データ スナップショット: 1事業所当たり商業年間商品販売額（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010203）。
 * stats47 の R2 `app/ranking/annual-sales-amount-per-establishment/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts annual-sales-amount-per-establishment`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "1事業所当たり商業年間商品販売額",
  statsDataId: "0000010203",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "百万円",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 1事業所当たり商業年間商品販売額（2022）。47 県の実データ。 */
export const ANNUAL_SALES_AMOUNT_PER_ESTABLISHMENT_2022: Dataset = normalizeDataset({
  indicator: "1事業所当たり商業年間商品販売額",
  unit: "百万円",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 434 },
    { code: "02000", value: 255.9 },
    { code: "03000", value: 279.6 },
    { code: "04000", value: 562.3 },
    { code: "05000", value: 223.6 },
    { code: "06000", value: 217.9 },
    { code: "07000", value: 268.8 },
    { code: "08000", value: 312 },
    { code: "09000", value: 356.1 },
    { code: "10000", value: 355.3 },
    { code: "11000", value: 450.4 },
    { code: "12000", value: 407.1 },
    { code: "13000", value: 2029.8 },
    { code: "14000", value: 520 },
    { code: "15000", value: 294.3 },
    { code: "16000", value: 312.4 },
    { code: "17000", value: 351.8 },
    { code: "18000", value: 255.3 },
    { code: "19000", value: 232.6 },
    { code: "20000", value: 302.7 },
    { code: "21000", value: 248.3 },
    { code: "22000", value: 369 },
    { code: "23000", value: 781.2 },
    { code: "24000", value: 269 },
    { code: "25000", value: 286.2 },
    { code: "26000", value: 347.4 },
    { code: "27000", value: 902 },
    { code: "28000", value: 414.3 },
    { code: "29000", value: 207.7 },
    { code: "30000", value: 210.6 },
    { code: "31000", value: 242.4 },
    { code: "32000", value: 200.4 },
    { code: "33000", value: 350.9 },
    { code: "34000", value: 490.2 },
    { code: "35000", value: 251.8 },
    { code: "36000", value: 212.1 },
    { code: "37000", value: 366.1 },
    { code: "38000", value: 321.5 },
    { code: "39000", value: 189.3 },
    { code: "40000", value: 527.6 },
    { code: "41000", value: 218.3 },
    { code: "42000", value: 215.1 },
    { code: "43000", value: 284.7 },
    { code: "44000", value: 230.4 },
    { code: "45000", value: 241.6 },
    { code: "46000", value: 249.1 },
    { code: "47000", value: 258.5 },
  ],
});
