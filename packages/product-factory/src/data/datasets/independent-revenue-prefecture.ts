/**
 * 実データ スナップショット: 自主財源額（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010104）。
 * stats47 の R2 `app/ranking/independent-revenue-prefecture/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts independent-revenue-prefecture`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "自主財源額",
  statsDataId: "0000010104",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "千円",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 自主財源額（2022）。47 県の実データ。 */
export const INDEPENDENT_REVENUE_PREFECTURE_2022: Dataset = normalizeDataset({
  indicator: "自主財源額",
  unit: "千円",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 1296057739 },
    { code: "02000", value: 309909022 },
    { code: "03000", value: 390374052 },
    { code: "04000", value: 609820922 },
    { code: "05000", value: 228526033 },
    { code: "06000", value: 299672642 },
    { code: "07000", value: 596410819 },
    { code: "08000", value: 686685940 },
    { code: "09000", value: 539990237 },
    { code: "10000", value: 520937313 },
    { code: "11000", value: 1219442164 },
    { code: "12000", value: 1333331738 },
    { code: "13000", value: 8183487668 },
    { code: "14000", value: 1594871990 },
    { code: "15000", value: 533367566 },
    { code: "16000", value: 306639409 },
    { code: "17000", value: 274884521 },
    { code: "18000", value: 212035448 },
    { code: "19000", value: 263078956 },
    { code: "20000", value: 561168070 },
    { code: "21000", value: 405534580 },
    { code: "22000", value: 678699613 },
    { code: "23000", value: 1788207946 },
    { code: "24000", value: 380740426 },
    { code: "25000", value: 302868945 },
    { code: "26000", value: 588786506 },
    { code: "27000", value: 2470864912 },
    { code: "28000", value: 1590897561 },
    { code: "29000", value: 207408136 },
    { code: "30000", value: 232848470 },
    { code: "31000", value: 108458709 },
    { code: "32000", value: 210175946 },
    { code: "33000", value: 383949126 },
    { code: "34000", value: 595485556 },
    { code: "35000", value: 353223193 },
    { code: "36000", value: 232405853 },
    { code: "37000", value: 235328066 },
    { code: "38000", value: 321322990 },
    { code: "39000", value: 124367129 },
    { code: "40000", value: 1251741102 },
    { code: "41000", value: 237228601 },
    { code: "42000", value: 263582960 },
    { code: "43000", value: 398475829 },
    { code: "44000", value: 290092995 },
    { code: "45000", value: 274435104 },
    { code: "46000", value: 314512165 },
    { code: "47000", value: 331189998 },
  ],
});
