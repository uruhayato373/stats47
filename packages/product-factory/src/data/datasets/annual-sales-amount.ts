/**
 * 実データ スナップショット: 商業年間商品販売額（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/annual-sales-amount/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts annual-sales-amount`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "商業年間商品販売額",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "百万円",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 商業年間商品販売額（2022）。47 県の実データ。 */
export const ANNUAL_SALES_AMOUNT_2022: Dataset = normalizeDataset({
  indicator: "商業年間商品販売額",
  unit: "百万円",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 18700093 },
    { code: "02000", value: 3236027 },
    { code: "03000", value: 3406973 },
    { code: "04000", value: 11896759 },
    { code: "05000", value: 2262309 },
    { code: "06000", value: 2527638 },
    { code: "07000", value: 4659696 },
    { code: "08000", value: 7117407 },
    { code: "09000", value: 5915979 },
    { code: "10000", value: 6017170 },
    { code: "11000", value: 18856335 },
    { code: "12000", value: 14176839 },
    { code: "13000", value: 211933731 },
    { code: "14000", value: 24986048 },
    { code: "15000", value: 6671198 },
    { code: "16000", value: 3374559 },
    { code: "17000", value: 4128756 },
    { code: "18000", value: 2136309 },
    { code: "19000", value: 1882936 },
    { code: "20000", value: 5964768 },
    { code: "21000", value: 4709681 },
    { code: "22000", value: 12344704 },
    { code: "23000", value: 44886931 },
    { code: "24000", value: 4058954 },
    { code: "25000", value: 3009470 },
    { code: "26000", value: 7471376 },
    { code: "27000", value: 64319587 },
    { code: "28000", value: 16450375 },
    { code: "29000", value: 1929642 },
    { code: "30000", value: 2129131 },
    { code: "31000", value: 1302355 },
    { code: "32000", value: 1428670 },
    { code: "33000", value: 5740838 },
    { code: "34000", value: 12531894 },
    { code: "35000", value: 3250908 },
    { code: "36000", value: 1549799 },
    { code: "37000", value: 3606861 },
    { code: "38000", value: 4203152 },
    { code: "39000", value: 1501224 },
    { code: "40000", value: 24122047 },
    { code: "41000", value: 1792552 },
    { code: "42000", value: 2934652 },
    { code: "43000", value: 4572590 },
    { code: "44000", value: 2527143 },
    { code: "45000", value: 2610308 },
    { code: "46000", value: 4122709 },
    { code: "47000", value: 3192442 },
  ],
});
