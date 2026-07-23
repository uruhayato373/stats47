/**
 * 実データ スナップショット: 65歳以上人口10万人当たり介護老人福祉施設数（都道府県別・2023年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010210）。
 * stats47 の R2 `app/ranking/nursing-welfare-facility-count-per-100k-65plus/values.json`（最新フル 47 県 = 2023年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts nursing-welfare-facility-count-per-100k-65plus`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "介護老人福祉施設数（65歳以上人口10万対）",
  statsDataId: "0000010210",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2023",
  retrievedAt: "2026-07-23",
  unit: "所",
  transform: "都道府県別・基準年（2023）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2023）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 65歳以上人口10万人当たり介護老人福祉施設数（2023）。47 県の実データ。 */
export const NURSING_WELFARE_FACILITY_COUNT_PER_100K_65PLUS_2023: Dataset = normalizeDataset({
  indicator: "65歳以上人口10万人当たり介護老人福祉施設数",
  unit: "所",
  year: "2023",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 22.8 },
    { code: "02000", value: 23.7 },
    { code: "03000", value: 30.7 },
    { code: "04000", value: 26 },
    { code: "05000", value: 34.7 },
    { code: "06000", value: 29.1 },
    { code: "07000", value: 28.7 },
    { code: "08000", value: 32.3 },
    { code: "09000", value: 25.8 },
    { code: "10000", value: 31.1 },
    { code: "11000", value: 22.7 },
    { code: "12000", value: 25.5 },
    { code: "13000", value: 18.3 },
    { code: "14000", value: 18.9 },
    { code: "15000", value: 30 },
    { code: "16000", value: 25.5 },
    { code: "17000", value: 22.8 },
    { code: "18000", value: 29.4 },
    { code: "19000", value: 23.3 },
    { code: "20000", value: 25.8 },
    { code: "21000", value: 24 },
    { code: "22000", value: 23.3 },
    { code: "23000", value: 15.4 },
    { code: "24000", value: 31.4 },
    { code: "25000", value: 25.5 },
    { code: "26000", value: 21.9 },
    { code: "27000", value: 18.4 },
    { code: "28000", value: 22.9 },
    { code: "29000", value: 27.4 },
    { code: "30000", value: 30.8 },
    { code: "31000", value: 24.6 },
    { code: "32000", value: 40.5 },
    { code: "33000", value: 27.1 },
    { code: "34000", value: 24 },
    { code: "35000", value: 23.1 },
    { code: "36000", value: 26.8 },
    { code: "37000", value: 29.9 },
    { code: "38000", value: 24.9 },
    { code: "39000", value: 24.4 },
    { code: "40000", value: 23.8 },
    { code: "41000", value: 23 },
    { code: "42000", value: 28 },
    { code: "43000", value: 25.2 },
    { code: "44000", value: 22.7 },
    { code: "45000", value: 27.1 },
    { code: "46000", value: 32.1 },
    { code: "47000", value: 17.7 },
  ],
});
