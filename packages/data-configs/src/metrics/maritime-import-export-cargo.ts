import type { MetricConfig } from "../types";

export const maritimeImportExportCargo: MetricConfig = {
  "key": "maritime-import-export-cargo",
  "title": "海上出入貨物",
  "unit": "トン",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C370701",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "海上出入貨物 都道府県ランキング【2023年】｜1位愛知県（200,603,167トン）",
  "seoDescription": "2023年の海上出入貨物を都道府県別に比較。1位は愛知県（200,603,167トン）、最下位は山形県（2,714,251トン）、最大と最小の差は73.9倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
