import type { MetricConfig } from "../types";

export const tourismResourceCount: MetricConfig = {
  "key": "tourism-resource-count",
  "title": "観光資源データ登録件数",
  "unit": "件",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P12-v2_2.html",
        "license": "非商用（GIS空間演算の集計結果は出典・加工者表示付きで利用）",
        "termsUrl": "https://nlftp.mlit.go.jp/ksj/other/agreement_02.html",
      },
      "ksjDataId": "P12",
      "ksjVersion": "14",
      "description": "観光資源台帳のA級以上と観光庁の観光地点等名簿を統合した国土数値情報P12の都道府県別登録件数。2014年9月30日時点であり、各都道府県の観光地を網羅した総数ではない。点・線・面の重複は県コードと観光資源_IDで除外して集計。",
    },
    "displayName": "国土交通省「国土数値情報（観光資源）」／加工：stats47",
    "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P12-v2_2.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2014,
    "to": 2014,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "観光資源データ登録件数ランキング【2014年】｜都道府県比較",
  "seoDescription": "国土数値情報P12に収録された観光資源・観光地点の2014年都道府県別登録件数を比較。元台帳の収録差を含むため、観光地の網羅数や魅力度を示すランキングではありません。",
  "isActive": true,
};
