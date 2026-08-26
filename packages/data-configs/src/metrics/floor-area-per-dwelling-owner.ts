import type { MetricConfig } from "../types";

export const floorAreaPerDwellingOwner: MetricConfig = {
  "key": "floor-area-per-dwelling-owner",
  "title": "持ち家住宅の延べ面積",
  "description": "持ち家として居住する住宅について、1住宅当たりの延べ面積を都道府県別に示す。居住室のほか、玄関、台所、浴室、廊下、押入れなど住宅内の床面積を含む。",
  "note": "持ち家だけを集計した値で、借家を含む住宅全体の平均ではない。共同住宅の共用廊下・階段や、別棟の物置・車庫は延べ面積に含まれない。",
  "unit": "ｍ2",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0210301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1978,
      2023,
    ],
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
        "unit": "ｍ2/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｍ2/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "持ち家住宅の延べ面積ランキング都道府県【2023年】｜1位富山県（167.5ｍ2）",
  "seoDescription": "2023年の持ち家住宅の延べ面積の都道府県別ランキング。1位富山県（167.5ｍ2）、最下位東京都（90.5ｍ2）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
