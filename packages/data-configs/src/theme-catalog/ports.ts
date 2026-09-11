import type { ThemeCatalog } from "./types";

export const PORTS_CATALOG: ThemeCatalog = {
  "key": "ports",
  "title": "港湾",
  "description": "港湾の貨物・コンテナ・船舶の取扱規模を地域間で比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "port-cargo-total",
      "shortLabel": "海上出入貨物量",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "海上出入貨物量は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "port-cargo-export",
      "shortLabel": "輸出貨物量",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "輸出貨物量は「輸出と輸入」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "port-cargo-import",
      "shortLabel": "輸入貨物量",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "輸入貨物量は「輸出と輸入」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "port-container-count",
      "shortLabel": "コンテナ個数",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "コンテナ個数は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "maritime-import-export-cargo",
      "shortLabel": "海上出入貨物(統計体系)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "類似総量の統計体系系列は定義照合・長期参考に限り保持し、二つの総量をprimaryにしない。"
      }
    },
    {
      "rankingKey": "port-inbound-ships",
      "shortLabel": "入港船舶隻数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "入港船舶隻数は「船舶と旅客の利用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "port-ships-tonnage",
      "shortLabel": "入港船舶総トン数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "入港船舶総トン数は「船舶と旅客の利用」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "passenger-ship-transport",
      "shortLabel": "旅客船輸送人員",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "旅客船輸送人員は「船舶と旅客の利用」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "ports-cargo-trend",
      "componentType": "line-chart",
      "title": "輸出入 海上貨物量の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "port-cargo-export",
            "label": "輸出貨物量",
            "colorRole": "population"
          },
          {
            "metricKey": "port-cargo-import",
            "label": "輸入貨物量",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "port-cargo-export",
        "port-cargo-import"
      ],
      "sourceName": "港湾統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "trade",
      "sortOrder": 10
    }
  ],
  "evidenceTopics": [
    {
      "key": "cargo-throughput-concentration",
      "lensKey": "participation",
      "title": "港湾貨物とコンテナ利用の集中",
      "question": "海上出入貨物量とコンテナ取扱個数には、港湾利用の地域的な集中がどう表れるか",
      "summary": "貨物量はトン、コンテナ個数はTEUで単位と対象が異なります。同じ量として足し合わせず、地域別の利用規模を別々に読みます。",
      "sourceKeys": [
        "mlit-port-statistics"
      ],
      "relatedRankingKeys": [
        "port-cargo-total",
        "port-container-count"
      ],
      "relatedChartKeys": [
        "ports-cargo-trend"
      ],
      "relatedThemeKeys": [
        "roads"
      ]
    },
    {
      "key": "passenger-port-use",
      "lensKey": "participation",
      "title": "船舶旅客の地域別利用",
      "question": "港湾旅客数は、港を利用する旅客移動の地域差をどう示すか",
      "summary": "港湾旅客数は船舶乗降人員の集計です。利用者の実人数や移動距離、航路数は示しません。",
      "sourceKeys": [
        "mlit-port-statistics"
      ],
      "relatedRankingKeys": [
        "passenger-ship-transport"
      ],
      "relatedThemeKeys": [
        "railway"
      ]
    }
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
  ],
  "sections": [
    {
      "key": "cargo",
      "title": "港湾の取扱規模",
      "description": "貨物のトン数とコンテナの個数・換算量は別の尺度です。対象外の県は0と見なしません。",
      "metricGroupKeys": [
        "cargo-1",
        "cargo-2"
      ],
      "chartKeys": []
    },
    {
      "key": "trade",
      "title": "輸出と輸入",
      "description": "港で取り扱う輸出入貨物量です。その県で生産・消費した量を直接表すものではありません。",
      "metricGroupKeys": [
        "trade"
      ],
      "chartKeys": [
        "ports-cargo-trend"
      ]
    },
    {
      "key": "ships-passengers",
      "title": "船舶と旅客の利用",
      "description": "入港隻数、総トン数、旅客人員は別の利用側面です。",
      "metricGroupKeys": [
        "ships-passengers"
      ],
      "chartKeys": []
    }
  ],
  "metricGroups": [
    {
      "key": "cargo-1",
      "title": "海上出入貨物量",
      "rankingKeys": [
        "port-cargo-total"
      ],
      "defaultCheckedKeys": [
        "port-cargo-total"
      ]
    },
    {
      "key": "cargo-2",
      "title": "コンテナ個数",
      "rankingKeys": [
        "port-container-count"
      ],
      "defaultCheckedKeys": [
        "port-container-count"
      ]
    },
    {
      "key": "trade",
      "title": "輸出と輸入",
      "rankingKeys": [
        "port-cargo-export",
        "port-cargo-import"
      ],
      "defaultCheckedKeys": [
        "port-cargo-export",
        "port-cargo-import"
      ]
    },
    {
      "key": "ships-passengers",
      "title": "船舶と旅客の利用",
      "rankingKeys": [
        "port-inbound-ships"
      ],
      "defaultCheckedKeys": [
        "port-inbound-ships"
      ]
    }
  ]
};
