import type { MetricConfig } from "../types";

export const actualIncomeWorkerHouseholdsPerMonth: MetricConfig = {
  "key": "actual-income-worker-households-per-month",
  "title": "実収入",
  "description": "家計調査の二人以上の世帯のうち勤労者世帯について、勤め先収入、事業・内職収入、社会保障給付等の経常収入と特別収入を合計した、1世帯当たり年平均1か月間の税込み収入。",
  "note": "都道府県値は県庁所在都市別で、都道府県全域の平均ではない。預貯金の引出し、保険金の受取り、借入金など、資産減少や負債増加を伴う実収入以外の受取は含まない。",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L01201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "実収入ランキング都道府県【2024年】｜1位東京都（794.2千円）",
  "seoDescription": "2024年の実収入の都道府県別ランキング。1位東京都（794.2千円）、最下位沖縄県（493.6千円）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
