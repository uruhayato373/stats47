import type { MetricConfig } from "../types";

export const soleProprietorSalesPerWorker: MetricConfig = {
  "key": "sole-proprietor-sales-per-worker",
  "title": "個人企業の従業者1人当たり売上高",
  "unit": "万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0003421679",
    // e-Stat 原単位 千円 → config unit 万円 の換算 (MONEY-UNIT-SCALE-01)。
    // 宣言しないと 千円 の値に 万円 のラベルが付いたまま配信される。
    "valueScale": 0.1,
    "cdTab": "460",
    "cdCat01": "0",
    "displayName": "個人企業経済調査",
    "url": "https://www.stat.go.jp/data/kojinke/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "個人企業の従業者1人当たり売上高ランキング都道府県【2025年】｜1位東京都（633万円）",
  "seoDescription": "2025年の個人企業の従業者1人当たり売上高の都道府県別ランキング。1位東京都（633万円）、最下位北海道（451万円）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
