/**
 * 実データ スナップショット: 地方税収額（都道府県別・2022年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010104）。
 * stats47 の R2 `app/ranking/local-tax-prefecture/values.json`（最新フル 47 県 = 2022年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts local-tax-prefecture`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "地方税",
  statsDataId: "0000010104",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2022",
  retrievedAt: "2026-07-23",
  unit: "千円",
  transform: "都道府県別・基準年（2022）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2022）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 地方税収額（2022）。47 県の実データ。 */
export const LOCAL_TAX_PREFECTURE_2022: Dataset = normalizeDataset({
  indicator: "地方税収額",
  unit: "千円",
  year: "2022",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 757893739 },
    { code: "02000", value: 182088567 },
    { code: "03000", value: 168825953 },
    { code: "04000", value: 351328218 },
    { code: "05000", value: 128793323 },
    { code: "06000", value: 146823789 },
    { code: "07000", value: 298171646 },
    { code: "08000", value: 475095282 },
    { code: "09000", value: 317897923 },
    { code: "10000", value: 313467169 },
    { code: "11000", value: 1020723285 },
    { code: "12000", value: 942223845 },
    { code: "13000", value: 6186895771 },
    { code: "14000", value: 1329620686 },
    { code: "15000", value: 318980220 },
    { code: "16000", value: 170733362 },
    { code: "17000", value: 185190790 },
    { code: "18000", value: 145213861 },
    { code: "19000", value: 131445735 },
    { code: "20000", value: 318859362 },
    { code: "21000", value: 302944618 },
    { code: "22000", value: 582858775 },
    { code: "23000", value: 1389012721 },
    { code: "24000", value: 298854033 },
    { code: "25000", value: 224245283 },
    { code: "26000", value: 375081078 },
    { code: "27000", value: 1455218797 },
    { code: "28000", value: 805042506 },
    { code: "29000", value: 166178656 },
    { code: "30000", value: 124817570 },
    { code: "31000", value: 73631922 },
    { code: "32000", value: 92761529 },
    { code: "33000", value: 275034434 },
    { code: "34000", value: 408277732 },
    { code: "35000", value: 202726538 },
    { code: "36000", value: 103404880 },
    { code: "37000", value: 146612420 },
    { code: "38000", value: 192499721 },
    { code: "39000", value: 90032222 },
    { code: "40000", value: 734299021 },
    { code: "41000", value: 118994050 },
    { code: "42000", value: 164659808 },
    { code: "43000", value: 224737382 },
    { code: "44000", value: 155940250 },
    { code: "45000", value: 143712411 },
    { code: "46000", value: 204328293 },
    { code: "47000", value: 184205358 },
  ],
});
