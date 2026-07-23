/**
 * 実データ スナップショット: 製造品出荷額等（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010103）。
 * stats47 の R2 `app/ranking/manufacturing-shipment-amount/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts manufacturing-shipment-amount`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "製造品出荷額等",
  statsDataId: "0000010103",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "百万円",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 製造品出荷額等（2023）。47 県の実データ。 */
export const MANUFACTURING_SHIPMENT_AMOUNT_2023: Dataset = normalizeDataset({
  indicator: "製造品出荷額等",
  unit: "百万円",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 6774675 },
    { code: "02000", value: 1716305 },
    { code: "03000", value: 3124685 },
    { code: "04000", value: 5469261 },
    { code: "05000", value: 1563610 },
    { code: "06000", value: 3355548 },
    { code: "07000", value: 5655367 },
    { code: "08000", value: 15006703 },
    { code: "09000", value: 9889543 },
    { code: "10000", value: 10148522 },
    { code: "11000", value: 15329652 },
    { code: "12000", value: 15293153 },
    { code: "13000", value: 8552651 },
    { code: "14000", value: 18479457 },
    { code: "15000", value: 5466666 },
    { code: "16000", value: 4133758 },
    { code: "17000", value: 3206413 },
    { code: "18000", value: 2649650 },
    { code: "19000", value: 2719360 },
    { code: "20000", value: 7008768 },
    { code: "21000", value: 6720192 },
    { code: "22000", value: 19773249 },
    { code: "23000", value: 58021789 },
    { code: "24000", value: 12311360 },
    { code: "25000", value: 9179393 },
    { code: "26000", value: 6459958 },
    { code: "27000", value: 19343010 },
    { code: "28000", value: 18461711 },
    { code: "29000", value: 2022684 },
    { code: "30000", value: 2891542 },
    { code: "31000", value: 886730 },
    { code: "32000", value: 1383834 },
    { code: "33000", value: 9603957 },
    { code: "34000", value: 11476455 },
    { code: "35000", value: 7781751 },
    { code: "36000", value: 2333664 },
    { code: "37000", value: 3080769 },
    { code: "38000", value: 5593086 },
    { code: "39000", value: 653960 },
    { code: "40000", value: 11616732 },
    { code: "41000", value: 2319201 },
    { code: "42000", value: 1851736 },
    { code: "43000", value: 3486265 },
    { code: "44000", value: 5683829 },
    { code: "45000", value: 1836509 },
    { code: "46000", value: 2415019 },
    { code: "47000", value: 506700 },
  ],
});
