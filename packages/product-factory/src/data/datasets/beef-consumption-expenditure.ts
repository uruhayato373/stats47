/**
 * 実データ スナップショット: 牛肉消費支出額（都道府県庁所在市・2024年）。
 * 出典: 家計調査（総務省）（statsDataId 0003348239）。
 * stats47 の R2 `app/ranking/beef-consumption-expenditure/values.json` から
 * 2024年の47地域を抽出した、P-14「家計・消費」の代表データセット。
 */
import { normalizeDataset, type Dataset } from "../dataset";
import type { SourceRow } from "../sources";

const SOURCE: SourceRow = {
  surveyName: "家計調査（総務省）",
  tableName: "都道府県庁所在市の二人以上世帯・年間牛肉消費支出額",
  statsDataId: "0003348239",
  url: "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  year: "2024",
  retrievedAt: "2026-08-28",
  unit: "円",
  transform:
    "都道府県庁所在市別の値を都道府県コードへ対応付け、stats47 の R2 から基準年（2024）を抽出。",
  notes:
    "県全域の平均ではなく都道府県庁所在市（東京都は区部）の二人以上世帯の値。基準年固定（2024）。欠損・秘匿・非該当は0埋めしない。公認・推奨を示すものではありません。",
};

export const BEEF_CONSUMPTION_EXPENDITURE_2024: Dataset = normalizeDataset({
  indicator: "牛肉消費支出額",
  unit: "円",
  year: "2024",
  source: SOURCE,
  isSample: false,
  values: [
    { code: "01000", value: 11348 },
    { code: "02000", value: 14864 },
    { code: "03000", value: 9474 },
    { code: "04000", value: 11884 },
    { code: "05000", value: 12245 },
    { code: "06000", value: 25268 },
    { code: "07000", value: 11654 },
    { code: "08000", value: 11841 },
    { code: "09000", value: 14661 },
    { code: "10000", value: 11941 },
    { code: "11000", value: 16827 },
    { code: "12000", value: 20616 },
    { code: "13000", value: 24458 },
    { code: "14000", value: 23832 },
    { code: "15000", value: 11380 },
    { code: "16000", value: 22259 },
    { code: "17000", value: 19892 },
    { code: "18000", value: 23892 },
    { code: "19000", value: 15204 },
    { code: "20000", value: 11015 },
    { code: "21000", value: 21563 },
    { code: "22000", value: 16378 },
    { code: "23000", value: 23231 },
    { code: "24000", value: 27344 },
    { code: "25000", value: 29280 },
    { code: "26000", value: 32380 },
    { code: "27000", value: 29682 },
    { code: "28000", value: 32683 },
    { code: "29000", value: 34474 },
    { code: "30000", value: 31131 },
    { code: "31000", value: 20091 },
    { code: "32000", value: 17749 },
    { code: "33000", value: 22369 },
    { code: "34000", value: 29403 },
    { code: "35000", value: 26390 },
    { code: "36000", value: 25227 },
    { code: "37000", value: 22168 },
    { code: "38000", value: 26272 },
    { code: "39000", value: 20839 },
    { code: "40000", value: 28661 },
    { code: "41000", value: 26809 },
    { code: "42000", value: 24981 },
    { code: "43000", value: 25634 },
    { code: "44000", value: 23564 },
    { code: "45000", value: 23235 },
    { code: "46000", value: 20871 },
    { code: "47000", value: 16019 },
  ],
});
