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
      "relatedRankingKeys": [
        "road-total-length-with-expressway"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
],
  evidenceTopics: [
    {
      key: "trunk-road-network-access",
      lensKey: "regional-access",
      title: "幹線道路ネットワークと地域アクセス",
      question:
        "高速道路の延長と道路密度には、広域移動を支えるネットワークの地域差がどう表れるか",
      summary:
        "高速道路延長と面積当たり道路延長を分け、道路網の総量と地域内の密度を読み比べます。",
      sourceKeys: ["mlit-whitepaper-2025-road-network"],
      relatedRankingKeys: [
        "road-expressway-length",
        "road-length-per-km2",
        "average-road-traffic-volume",
      ],
      relatedChartKeys: ["roads-length-trend"],
      relatedThemeKeys: ["local-economy"],
    },
    {
      key: "road-stock-maintenance",
      lensKey: "sustainability",
      title: "道路ストックの規模と維持管理",
      question:
        "道路実延長と舗装率を合わせると、維持対象の規模と整備水準をどう読み分けられるか",
      summary:
        "延長は維持対象の規模、舗装率は整備水準を示します。延長だけで老朽化の程度は判断しません。",
      sourceKeys: ["mlit-whitepaper-2025-infrastructure-maintenance"],
      relatedRankingKeys: [
        "road-total-length-with-expressway",
        "main-road-paving-rate",
      ],
      relatedChartKeys: ["roads-length-trend"],
      relatedThemeKeys: ["local-finance"],
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
