/**
 * 実データ スナップショット: 県内総生産（名目・支出側・H27年基準）（都道府県別・2020年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/gross-prefectural-product-expenditure-nominal-h27/values.json`（最新フル 47 県 = 2020年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts gross-prefectural-product-expenditure-nominal-h27`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "県内総生産（支出側・名目）",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2020",
  retrievedAt: "2026-07-23",
  unit: "百万円",
  transform: "都道府県別・基準年（2020）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2020）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 県内総生産（名目・支出側・H27年基準）（2020）。47 県の実データ。 */
export const GROSS_PREFECTURAL_PRODUCT_EXPENDITURE_NOMINAL_H27_2020: Dataset = normalizeDataset({
  indicator: "県内総生産（名目・支出側・H27年基準）",
  unit: "百万円",
  year: "2020",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 19725624 },
    { code: "02000", value: 4456607 },
    { code: "03000", value: 4747426 },
    { code: "04000", value: 9485225 },
    { code: "05000", value: 3530452 },
    { code: "06000", value: 4284158 },
    { code: "07000", value: 7828577 },
    { code: "08000", value: 13771281 },
    { code: "09000", value: 8946482 },
    { code: "10000", value: 8653495 },
    { code: "11000", value: 22922645 },
    { code: "12000", value: 20775634 },
    { code: "13000", value: 109601589 },
    { code: "14000", value: 33905464 },
    { code: "15000", value: 8857506 },
    { code: "16000", value: 4729874 },
    { code: "17000", value: 4527743 },
    { code: "18000", value: 3571069 },
    { code: "19000", value: 3552685 },
    { code: "20000", value: 8214074 },
    { code: "21000", value: 7662998 },
    { code: "22000", value: 17105232 },
    { code: "23000", value: 39659291 },
    { code: "24000", value: 8273134 },
    { code: "25000", value: 6739736 },
    { code: "26000", value: 10167991 },
    { code: "27000", value: 39720316 },
    { code: "28000", value: 21735871 },
    { code: "29000", value: 3685868 },
    { code: "30000", value: 3625091 },
    { code: "31000", value: 1819938 },
    { code: "32000", value: 2575687 },
    { code: "33000", value: 7606440 },
    { code: "34000", value: 11555366 },
    { code: "35000", value: 6148146 },
    { code: "36000", value: 3185168 },
    { code: "37000", value: 3734443 },
    { code: "38000", value: 4827460 },
    { code: "39000", value: 2354276 },
    { code: "40000", value: 18886929 },
    { code: "41000", value: 3045909 },
    { code: "42000", value: 4538708 },
    { code: "43000", value: 6105086 },
    { code: "44000", value: 4458030 },
    { code: "45000", value: 3602456 },
    { code: "46000", value: 5610271 },
    { code: "47000", value: 4260875 },
  ],
});
