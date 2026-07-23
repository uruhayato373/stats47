/**
 * 実データ スナップショット: 歳入決算総額（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010104）。
 * stats47 の R2 `app/ranking/total-revenue-prefecture/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts total-revenue-prefecture`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "歳入決算総額",
  statsDataId: "0000010104",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "千円",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 歳入決算総額（2022）。47 県の実データ。 */
export const TOTAL_REVENUE_PREFECTURE_2022: Dataset = normalizeDataset({
  indicator: "歳入決算総額",
  unit: "千円",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 3094654845 },
    { code: "02000", value: 798600986 },
    { code: "03000", value: 879040072 },
    { code: "04000", value: 1134875591 },
    { code: "05000", value: 658765038 },
    { code: "06000", value: 716149217 },
    { code: "07000", value: 1344287454 },
    { code: "08000", value: 1340774026 },
    { code: "09000", value: 1010319939 },
    { code: "10000", value: 992572541 },
    { code: "11000", value: 2285622612 },
    { code: "12000", value: 2240426182 },
    { code: "13000", value: 9755045494 },
    { code: "14000", value: 2539155772 },
    { code: "15000", value: 1193390575 },
    { code: "16000", value: 643086782 },
    { code: "17000", value: 649453271 },
    { code: "18000", value: 554078342 },
    { code: "19000", value: 613385091 },
    { code: "20000", value: 1180398469 },
    { code: "21000", value: 981072160 },
    { code: "22000", value: 1384631998 },
    { code: "23000", value: 2924785931 },
    { code: "24000", value: 867829220 },
    { code: "25000", value: 683731180 },
    { code: "26000", value: 1172280594 },
    { code: "27000", value: 3942613114 },
    { code: "28000", value: 2683182088 },
    { code: "29000", value: 603570473 },
    { code: "30000", value: 662895167 },
    { code: "31000", value: 405728488 },
    { code: "32000", value: 599893659 },
    { code: "33000", value: 802008865 },
    { code: "34000", value: 1221698617 },
    { code: "35000", value: 776771731 },
    { code: "36000", value: 563618625 },
    { code: "37000", value: 515593484 },
    { code: "38000", value: 734178021 },
    { code: "39000", value: 496689021 },
    { code: "40000", value: 2277786328 },
    { code: "41000", value: 613699133 },
    { code: "42000", value: 802100998 },
    { code: "43000", value: 1028620307 },
    { code: "44000", value: 736303105 },
    { code: "45000", value: 722275169 },
    { code: "46000", value: 975815228 },
    { code: "47000", value: 932266646 },
  ],
});
