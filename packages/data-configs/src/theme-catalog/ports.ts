import type { ThemeCatalog } from "./types";

export const PORTS_CATALOG: ThemeCatalog = {
  "key": "ports",
  "title": "港湾",
  "description": "都道府県別の港湾取扱貨物量・コンテナ個数・入港船舶・港湾旅客数をランキングとチャートで比較。貿易立国日本の玄関口がどの地域に集中するのか、輸出入貨物の偏在やフェリー・旅客船の地域交通機能を47都道府県のデータで可視化します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "port-cargo-total",
      "shortLabel": "海上出入貨物量",
      "role": "primary"
    },
    {
      "rankingKey": "port-cargo-export",
      "shortLabel": "輸出貨物量",
      "role": "context"
    },
    {
      "rankingKey": "port-cargo-import",
      "shortLabel": "輸入貨物量",
      "role": "context"
    },
    {
      "rankingKey": "port-container-count",
      "shortLabel": "コンテナ個数",
      "role": "primary"
    },
    {
      "rankingKey": "maritime-import-export-cargo",
      "shortLabel": "海上出入貨物(統計体系)",
      "role": "context"
    },
    {
      "rankingKey": "port-inbound-ships",
      "shortLabel": "入港船舶隻数",
      "role": "secondary"
    },
    {
      "rankingKey": "port-ships-tonnage",
      "shortLabel": "入港船舶総トン数",
      "role": "context"
    },
    {
      "rankingKey": "port-passengers-total",
      "shortLabel": "港湾旅客数",
      "role": "primary"
    },
    {
      "rankingKey": "passenger-ship-transport",
      "shortLabel": "旅客船輸送人員",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "ports-cargo-trend",
      "componentType": "line-chart",
      "title": "輸出入 海上貨物量の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0003130738",
            "cdCat01": "110"
          },
          {
            "statsDataId": "0003130738",
            "cdCat01": "120"
          }
        ],
        "labels": [
          "輸出",
          "輸入"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "port-cargo-total"
      ],
      "sourceName": "港湾統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    }
  ],
  evidenceTopics: [
    {
      key: "cargo-throughput-concentration",
      lensKey: "participation",
      title: "港湾貨物とコンテナ利用の集中",
      question:
        "海上出入貨物量とコンテナ取扱個数には、港湾利用の地域的な集中がどう表れるか",
      summary:
        "貨物量はトン、コンテナ個数はTEUで単位と対象が異なります。同じ量として足し合わせず、地域別の利用規模を別々に読みます。",
      sourceKeys: ["mlit-port-statistics"],
      relatedRankingKeys: ["port-cargo-total", "port-container-count"],
      relatedChartKeys: ["ports-cargo-trend"],
      relatedThemeKeys: ["roads"],
    },
    {
      key: "passenger-port-use",
      lensKey: "participation",
      title: "船舶旅客の地域別利用",
      question:
        "港湾旅客数は、港を利用する旅客移動の地域差をどう示すか",
      summary:
        "港湾旅客数は船舶乗降人員の集計です。利用者の実人数や移動距離、航路数は示しません。",
      sourceKeys: ["mlit-port-statistics"],
      relatedRankingKeys: ["port-passengers-total"],
      relatedThemeKeys: ["railway"],
    },
  ],
  "keywords": [
    "港湾",
    "港",
    "貿易",
    "コンテナ",
    "貨物",
    "輸出入",
    "フェリー",
    "海運"
  ],
  "relatedArticleTagKeys": [
    "港湾",
    "貿易",
    "物流",
    "海運"
  ]
};
