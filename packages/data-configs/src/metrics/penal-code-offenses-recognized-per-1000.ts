import type { MetricConfig } from "../types";

export const penalCodeOffensesRecognizedPer1000: MetricConfig = {
  "key": "penal-code-offenses-recognized-per-1000",
  "title": "刑法犯認知件数",
  "subtitle": "人口千人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "犯罪統計の刑法犯総数（交通業過を除く）の認知件数を総人口で除し、人口千人当たりに換算した値。",
  "note": "認知件数は、被害の届出、告訴、告発などを端緒として警察が犯罪の発生を認知した事件数であり、未認知の事件は含まれない。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
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
  "groupKey": "criminal-recognition-count",
  "seoTitle": "刑法犯認知件数（人口千人当たり）ランキング都道府県",
  "seoDescription": "人口千人当たりの刑法犯認知件数を都道府県別に比較。総数とは区別し、人口規模を揃えて地域差と経年変化を地図やグラフで確認できます。",
  "isActive": true,
};
