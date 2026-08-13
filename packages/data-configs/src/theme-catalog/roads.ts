import type { ThemeCatalog } from "./types";

export const ROADS_CATALOG: ThemeCatalog = {
  "key": "roads",
  "title": "道路",
  "description": "都道府県別の道路実延長（高速道路・国道・地方道・市町村道）・道路密度・舗装率・交通量をランキングとチャートで比較。高速道路網の地域差や面積あたり道路密度の都市部集中、道の駅の整備状況を47都道府県のデータで読み解きます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "road-total-length-with-expressway",
      "shortLabel": "道路実延長(高速含む)",
      "role": "primary"
    },
    {
      "rankingKey": "road-expressway-length",
      "shortLabel": "高速道路延長",
      "role": "primary"
    },
    {
      "rankingKey": "road-total-length",
      "shortLabel": "道路実延長",
      "role": "context"
    },
    {
      "rankingKey": "road-national-route-length",
      "shortLabel": "一般国道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-prefectural-route-length",
      "shortLabel": "主要地方道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-municipal-length",
      "shortLabel": "市町村道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-length-per-km2",
      "shortLabel": "道路密度",
      "role": "secondary"
    },
    {
      "rankingKey": "main-road-paving-rate",
      "shortLabel": "主要道路舗装率",
      "role": "secondary"
    },
    {
      "rankingKey": "average-road-traffic-volume",
      "shortLabel": "道路平均交通量",
      "role": "secondary"
    },
    {
      "rankingKey": "roadside-station-count",
      "shortLabel": "道の駅数",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "roads-length-trend",
      "componentType": "line-chart",
      "title": "道路実延長・高速道路延長の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010108",
            "cdCat01": "H711001"
          },
          {
            "statsDataId": "0000010108",
            "cdCat01": "H7113"
          }
        ],
        "labels": [
          "道路実延長(高速含む)",
          "高速道路延長"
        ],
        "seriesColors": [
          "population",
          "danger"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "rankingLink": "/ranking/road-total-length-with-expressway",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
],
  "keywords": [
    "道路",
    "高速道路",
    "国道",
    "県道",
    "舗装率",
    "交通量",
    "道の駅",
    "インフラ"
  ],
  "relatedArticleTagKeys": [
    "道路",
    "高速道路",
    "交通",
    "インフラ"
  ]
};
