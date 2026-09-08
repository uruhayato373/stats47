import type { MetricConfig } from "../types";

export const disposableIncomeWorkerHouseholds: MetricConfig = {
  "key": "disposable-income-worker-households",
  "title": "可処分所得（二人以上の世帯のうち勤労者世帯）",
  "description": "家計調査の二人以上の世帯のうち勤労者世帯について、1世帯当たり年平均1か月間の実収入から、直接税や社会保険料などの非消費支出を差し引いた額。",
  "note": "都道府県値は県庁所在都市別の結果で、都道府県全域の平均ではない。2007年までは農林漁家世帯を除き、2008年から含む。",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L3130",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1975,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万円"
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "可処分所得（二人以上の世帯のうち勤労者世帯）ランキング都道府県【2024年】｜1位東京都（637,958円）",
  "seoDescription": "2024年の可処分所得（二人以上の世帯のうち勤労者世帯）の都道府県別ランキング。1位東京都（637,958円）、最下位愛媛県（420,678円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
