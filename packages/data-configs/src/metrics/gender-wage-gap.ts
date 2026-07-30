import type { MetricConfig } from "../types";

export const genderWageGap: MetricConfig = {
  "key": "gender-wage-gap",
  "title": "男女間賃金格差（女性/男性）",
  "unit": "%",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0003426933",
    "cdTab": "10",
    "cdCat02": "01",
    "cdCat03": "01",
    "cdCat04": "01",
    "axisRatio": {
      "axis": "cat01",
      "numeratorCodes": ["03"],
      "denominatorCodes": ["02"],
    },
    "displayName": "賃金構造基本統計調査",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateRdYlBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    // 取り込み時に axisRatio (cat01: 女 03 / 男 02) で確定するので実行時計算ではない。
    // 旧: female/male-scheduled-earnings を実行時に割る宣言だったが、builder が
    // calculation.type を焼いていなかったため常に空を返していた。
    "isCalculated": false,
  },
  "groupKey": "gender-wage",
  "seoTitle": "男女間賃金格差（女性/男性）ランキング都道府県【2022年】｜1位愛媛県（89.7%）",
  "seoDescription": "2022年の男女間賃金格差（女性/男性）の都道府県別ランキング。1位愛媛県（89.7%）、最下位宮城県（67.5%）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
