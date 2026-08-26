import type { MetricConfig } from "../types";

export const perTaxpayerTaxableIncome: MetricConfig = {
  "key": "per-taxpayer-taxable-income",
  "title": "課税対象所得",
  "description": "個人の市町村民税所得割の課税対象となった所得総額を、所得割の納税義務者数で割った納税義務者1人当たりの金額。",
  "note": "各年度の前年所得を7月1日時点で集計し、分離課税の退職所得を除く。地方税法上の所得控除前の所得で、手取り収入や全住民の平均所得ではない。",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D02206",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1985,
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
  "seoTitle": "課税対象所得ランキング都道府県【2024年】｜1位東京都（5,420.2千円）",
  "seoDescription": "2024年の課税対象所得の都道府県別ランキング。1位東京都（5,420.2千円）、最下位秋田県（3,044.2千円）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
