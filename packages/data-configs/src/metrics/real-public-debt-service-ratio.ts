import type { MetricConfig } from "../types";

export const realPublicDebtServiceRatio: MetricConfig = {
  "key": "real-public-debt-service-ratio",
  "title": "実質公債費比率",
  "subtitle": "都道府県財政",
  "description": "一般会計等が負担する元利償還金と、公営企業債の償還金への繰出金など準元利償還金を含む実質的な公債費相当額が、標準財政規模を基本とした額に占める割合の過去3年間平均。",
  "note": "分子から特定財源と基準財政需要額算入額を、分母の標準財政規模からも元利償還金等に係る基準財政需要額算入額を控除して算定する。単年度の公債費割合ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2111",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "実質公債費比率ランキング都道府県【2022年】｜1位北海道（18.9）",
  "seoDescription": "2022年の実質公債費比率の都道府県別ランキング。1位北海道（18.9）、最下位東京都（1.2）で15.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
