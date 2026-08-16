import type { MetricConfig } from "../types";

export const constructionContractDisasterRecovery: MetricConfig = {
  "key": "construction-contract-disaster-recovery",
  "title": "災害復旧工事請負契約額",
  "unit": "百万円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003458635",
    "cdCat01": "100",
    "cdCat02": "140",
    "displayName": "建設工事受注動態統計調査",
    "url": "https://www.mlit.go.jp/sogoseisaku/jouhouka/sosei_jouhouka_tk4_000002.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.01,
    "decimalPlaces": 1,
    "displayUnit": "億円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "災害復旧工事請負契約額ランキング都道府県【2023年】｜1位福島県（95,969百万円）",
  "seoDescription": "2023年の災害復旧工事請負契約額の都道府県別ランキング。1位福島県（95,969百万円）、最下位香川県（1,058百万円）で90.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
