import type { MetricConfig } from "../types";

export const privateRentalHousingRentPer33m2: MetricConfig = {
  "key": "private-rental-housing-rent-per-3-3m2",
  "title": "民営家賃（3.3m²当たり月額）",
  "description": "県庁所在市等で調査した民営借家の3.3m²当たり1か月の家賃です。都道府県全域の平均家賃や世帯が実際に支払った住居費とは対象が異なります。",
  "unit": "円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H04102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "民営家賃（3.3m²当たり月額）｜都道府県比較",
  "seoDescription": "民営家賃（3.3m²当たり月額）を都道府県別に比較。指標の対象地域・分母・単位・年次を確認し、表とグラフで地域差を把握できます。",
  "isActive": true,
};
