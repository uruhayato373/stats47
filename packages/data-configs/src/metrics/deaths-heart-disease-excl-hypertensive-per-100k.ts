import type { MetricConfig } from "../types";

export const deathsHeartDiseaseExclHypertensivePer100k: MetricConfig = {
  "key": "deaths-heart-disease-excl-hypertensive-per-100k",
  "title": "心疾患による死亡者数",
  "description": "人口動態調査の心疾患（高血圧性を除く）による死亡者数を日本人人口で除し、10万倍した値です。年齢調整死亡率ではありません。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1979,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "心疾患による死亡者数ランキング都道府県【2023年】｜1位山口県（284.2人）",
  "seoDescription": "2023年の心疾患による死亡者数の都道府県別ランキング。1位山口県（284.2人）、最下位愛知県（130.8人）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "日本人人口10万人当たり"
};
