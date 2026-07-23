/**
 * 実データ スナップショット: 可処分所得（二人以上の世帯のうち勤労者世帯）（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010112）。
 * stats47 の R2 `app/ranking/disposable-income-worker-households/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts disposable-income-worker-households`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "可処分所得（勤労者世帯）",
  statsDataId: "0000010112",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "円",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 可処分所得（二人以上の世帯のうち勤労者世帯）（2024）。47 県の実データ。 */
export const DISPOSABLE_INCOME_WORKER_HOUSEHOLDS_2024: Dataset = normalizeDataset({
  indicator: "可処分所得（二人以上の世帯のうち勤労者世帯）",
  unit: "円",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 489686 },
    { code: "02000", value: 476304 },
    { code: "03000", value: 521680 },
    { code: "04000", value: 547106 },
    { code: "05000", value: 433606 },
    { code: "06000", value: 566517 },
    { code: "07000", value: 523065 },
    { code: "08000", value: 577549 },
    { code: "09000", value: 584767 },
    { code: "10000", value: 491953 },
    { code: "11000", value: 620576 },
    { code: "12000", value: 605961 },
    { code: "13000", value: 637958 },
    { code: "14000", value: 562606 },
    { code: "15000", value: 537032 },
    { code: "16000", value: 579772 },
    { code: "17000", value: 569917 },
    { code: "18000", value: 575600 },
    { code: "19000", value: 484107 },
    { code: "20000", value: 506666 },
    { code: "21000", value: 543034 },
    { code: "22000", value: 561029 },
    { code: "23000", value: 540873 },
    { code: "24000", value: 514455 },
    { code: "25000", value: 546380 },
    { code: "26000", value: 548702 },
    { code: "27000", value: 494297 },
    { code: "28000", value: 450485 },
    { code: "29000", value: 595091 },
    { code: "30000", value: 462553 },
    { code: "31000", value: 493838 },
    { code: "32000", value: 500607 },
    { code: "33000", value: 503504 },
    { code: "34000", value: 522631 },
    { code: "35000", value: 521809 },
    { code: "36000", value: 558662 },
    { code: "37000", value: 522605 },
    { code: "38000", value: 420678 },
    { code: "39000", value: 522375 },
    { code: "40000", value: 474060 },
    { code: "41000", value: 498543 },
    { code: "42000", value: 487600 },
    { code: "43000", value: 502673 },
    { code: "44000", value: 466098 },
    { code: "45000", value: 426284 },
    { code: "46000", value: 473055 },
    { code: "47000", value: 423924 },
  ],
});
