/**
 * 実データ スナップショット: 民営賃貸住宅家賃（3.3m²当たり）（都道府県別・2024年）。
 * 出典: 社会・人口統計体系（政府統計の総合窓口 e-Stat）（statsDataId 0000010208）。
 * stats47 の R2 `app/ranking/private-rental-housing-rent-per-3-3m2/values.json`（最新フル 47 県 = 2024年）を
 * `load-ranking-values.ts` で取得しスナップショットした基準年固定データ。
 * 再生成: `npx tsx src/data/load-ranking-values.ts private-rental-housing-rent-per-3-3m2`。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "社会・人口統計体系（政府統計の総合窓口 e-Stat）",
  tableName: "民営賃貸住宅の家賃（3.3m²当たり）",
  statsDataId: "0000010208",
  url: "https://www.stat.go.jp/data/ssds/index.htm",
  year: "2024",
  retrievedAt: "2026-07-23",
  unit: "円",
  transform: "都道府県別・基準年（2024）の値を stats47 が一次資料から抽出。集計・可視化は独自に実施。",
  notes: "基準年固定（2024）。欠損・秘匿・非該当は 0 埋めせず null で保持。出典の数値・表を基に stats47 作成。公認・推奨を示すものではありません。",
};

/** 民営賃貸住宅家賃（3.3m²当たり）（2024）。47 県の実データ。 */
export const PRIVATE_RENTAL_HOUSING_RENT_PER_3_3M2_2024: Dataset = normalizeDataset({
  indicator: "民営賃貸住宅家賃（3.3m²当たり）",
  unit: "円",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 4296 },
    { code: "02000", value: 3670 },
    { code: "03000", value: 4070 },
    { code: "04000", value: 5267 },
    { code: "05000", value: 4144 },
    { code: "06000", value: 3875 },
    { code: "07000", value: 4039 },
    { code: "08000", value: 3961 },
    { code: "09000", value: 4345 },
    { code: "10000", value: 3833 },
    { code: "11000", value: 5837 },
    { code: "12000", value: 4928 },
    { code: "13000", value: 9736 },
    { code: "14000", value: 6670 },
    { code: "15000", value: 3966 },
    { code: "16000", value: 3867 },
    { code: "17000", value: 3708 },
    { code: "18000", value: 3927 },
    { code: "19000", value: 4163 },
    { code: "20000", value: 3870 },
    { code: "21000", value: 3811 },
    { code: "22000", value: 4602 },
    { code: "23000", value: 5229 },
    { code: "24000", value: 4314 },
    { code: "25000", value: 4240 },
    { code: "26000", value: 5962 },
    { code: "27000", value: 6182 },
    { code: "28000", value: 5554 },
    { code: "29000", value: 5129 },
    { code: "30000", value: 3442 },
    { code: "31000", value: 3803 },
    { code: "32000", value: 3871 },
    { code: "33000", value: 4179 },
    { code: "34000", value: 4519 },
    { code: "35000", value: 3601 },
    { code: "36000", value: 3665 },
    { code: "37000", value: 4377 },
    { code: "38000", value: 3681 },
    { code: "39000", value: 4150 },
    { code: "40000", value: 4839 },
    { code: "41000", value: 3443 },
    { code: "42000", value: 4883 },
    { code: "43000", value: 3833 },
    { code: "44000", value: 3587 },
    { code: "45000", value: 3690 },
    { code: "46000", value: 4573 },
    { code: "47000", value: 4614 },
  ],
});
