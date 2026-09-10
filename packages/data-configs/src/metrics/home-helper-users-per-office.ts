import type { MetricConfig } from "../types";

export const homeHelperUsersPerOffice: MetricConfig = {
  "key": "home-helper-users-per-office",
  "title": "訪問介護利用者数",
  "subtitle": "訪問介護1事業所当たり",
  "description": "介護サービス施設・事業所調査に基づく、訪問介護1事業所当たりの利用者数です。地域全体の利用者総数ではなく、事業所規模を比べる値です。",
  "note": "訪問診療や訪問看護の利用者数とは異なります。人口や面積で再度割らず、原典の事業所当たりの値で比較します。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J05109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "訪問介護1事業所当たり利用者数の都道府県ランキング",
  "seoDescription": "訪問介護1事業所当たりの利用者数を都道府県別に比較。原典の年・単位を確認しながら、事業所規模の地域差を地図とグラフで見ることができます。",
  "isActive": true,
};
