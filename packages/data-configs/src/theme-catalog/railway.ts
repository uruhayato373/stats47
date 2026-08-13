import type { ThemeCatalog } from "./types";

export const RAILWAY_CATALOG: ThemeCatalog = {
  "key": "railway",
  "title": "鉄道",
  "description": "都道府県別の鉄道駅乗降客数・JR/民鉄輸送人員・鉄道駅数をランキングとチャートで比較。首都圏・関西圏への利用集中と地方鉄道の縮小、旅客輸送とJR貨物の役割を47都道府県のデータで読み解きます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-passengers",
      "shortLabel": "鉄道駅乗降客数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR輸送人員",
      "role": "primary"
    },
    {
      "rankingKey": "private-railway-passenger-transport",
      "shortLabel": "民鉄輸送人員",
      "role": "secondary"
    },
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "railway-passenger-trend",
      "componentType": "line-chart",
      "title": "鉄道輸送人員の推移（JR・民鉄）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3704"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3705"
          }
        ],
        "labels": [
          "JR",
          "民鉄"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "rankingLink": "/ranking/jr-passenger-transport",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
    {
      "componentKey": "railway-freight-trend",
      "componentType": "line-chart",
      "title": "JR貨物発送量の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3702"
          }
        ],
        "labels": [
          "JR貨物発送量"
        ],
        "seriesColors": [
          "special"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "rankingLink": "/ranking/jr-freight-shipment",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20
    }
  ],
  "keywords": [
    "鉄道",
    "JR",
    "私鉄",
    "民鉄",
    "駅",
    "乗降客",
    "輸送人員",
    "鉄道貨物"
  ],
  "relatedArticleTagKeys": [
    "鉄道",
    "交通",
    "公共交通"
  ]
};
