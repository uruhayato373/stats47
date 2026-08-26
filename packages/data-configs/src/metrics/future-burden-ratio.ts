import type { MetricConfig } from "../types";

export const futureBurdenRatio: MetricConfig = {
  "key": "future-burden-ratio",
  "title": "将来負担比率",
  "subtitle": "都道府県財政",
  "description": "公営企業、地方公社、損失補償を行う出資法人等を含め、一般会計等が将来負担すべき実質的な負債が、標準財政規模を基本とした額に占める割合。",
  "note": "将来負担額から財政調整基金などの充当可能財源等を控除し、分母の標準財政規模からも元利償還金等に係る基準財政需要額算入額を控除して算定する。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2112",
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
  "seoTitle": "将来負担比率ランキング都道府県【2022年】｜1位兵庫県（330.8）",
  "seoDescription": "2022年の将来負担比率の都道府県別ランキング。1位兵庫県（330.8）、最下位東京都（17.3）で19.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
