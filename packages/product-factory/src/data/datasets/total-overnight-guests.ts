/**
 * 実データ スナップショット: 延べ宿泊者数（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010107）。
 * stats47 の R2 `app/ranking/total-overnight-guests/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts total-overnight-guests`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "延べ宿泊者数",
  statsDataId: "0000010107",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "人泊",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 延べ宿泊者数（2024）。47 県の実データ。 */
export const TOTAL_OVERNIGHT_GUESTS_2024: Dataset = normalizeDataset({
  indicator: "延べ宿泊者数",
  unit: "人泊",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 36624970 },
    { code: "02000", value: 3974150 },
    { code: "03000", value: 5085580 },
    { code: "04000", value: 9018080 },
    { code: "05000", value: 2705240 },
    { code: "06000", value: 3839250 },
    { code: "07000", value: 7780040 },
    { code: "08000", value: 6029650 },
    { code: "09000", value: 9241520 },
    { code: "10000", value: 6732810 },
    { code: "11000", value: 5035590 },
    { code: "12000", value: 26073350 },
    { code: "13000", value: 91633100 },
    { code: "14000", value: 21477180 },
    { code: "15000", value: 7481650 },
    { code: "16000", value: 3264710 },
    { code: "17000", value: 10187930 },
    { code: "18000", value: 2915150 },
    { code: "19000", value: 6255920 },
    { code: "20000", value: 14141660 },
    { code: "21000", value: 5942860 },
    { code: "22000", value: 18713250 },
    { code: "23000", value: 19329260 },
    { code: "24000", value: 6887260 },
    { code: "25000", value: 4115610 },
    { code: "26000", value: 28541700 },
    { code: "27000", value: 50030170 },
    { code: "28000", value: 13662780 },
    { code: "29000", value: 2290410 },
    { code: "30000", value: 3988270 },
    { code: "31000", value: 1884720 },
    { code: "32000", value: 2876880 },
    { code: "33000", value: 4894990 },
    { code: "34000", value: 10526330 },
    { code: "35000", value: 3575660 },
    { code: "36000", value: 1701370 },
    { code: "37000", value: 3862130 },
    { code: "38000", value: 3640370 },
    { code: "39000", value: 2202930 },
    { code: "40000", value: 21247880 },
    { code: "41000", value: 2001900 },
    { code: "42000", value: 6271320 },
    { code: "43000", value: 6613750 },
    { code: "44000", value: 5763410 },
    { code: "45000", value: 2948100 },
    { code: "46000", value: 5966860 },
    { code: "47000", value: 22095990 },
  ],
});
