import type { ThemeCatalog } from "./types";

export const ROADS_CATALOG: ThemeCatalog = {
  "key": "roads",
  "title": "道路",
  "description": "道路ストックの延長と密度、利用交通量、整備状況を分けて比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "road-total-length-with-expressway",
      "shortLabel": "道路実延長(高速含む)",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "道路実延長(高速含む)は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "road-expressway-length",
      "shortLabel": "高速道路延長",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高速道路延長は「高速道路ネットワーク」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "road-total-length",
      "shortLabel": "道路実延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "道路実延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-national-route-length",
      "shortLabel": "一般国道延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "一般国道延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-prefectural-route-length",
      "shortLabel": "主要地方道延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "主要地方道延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-municipal-length",
      "shortLabel": "市町村道延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "市町村道延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-length-per-km2",
      "shortLabel": "道路実延長（総面積1km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-08",
        "rationale": "総面積1km²を基準にした道路実延長として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "main-road-paving-rate",
      "shortLabel": "主要道路舗装率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "主要道路舗装率は「整備水準と利用状況」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "average-road-traffic-volume",
      "shortLabel": "道路平均交通量（昼間12時間）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-08",
        "rationale": "12時間を基準にした道路平均交通量として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "roadside-station-count",
      "shortLabel": "道の駅数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mlit.go.jp/road/Michi-no-Eki/list.html",
        "surveyedAt": "2026-09-08",
        "rationale": "道の駅数は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "roads-length-trend",
      "componentType": "line-chart",
      "title": "道路実延長・高速道路延長の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "road-total-length-with-expressway",
            "label": "道路実延長(高速含む)",
            "colorRole": "population"
          },
          {
            "metricKey": "road-expressway-length",
            "label": "高速道路延長",
            "colorRole": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "road-total-length-with-expressway",
        "road-expressway-length"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "road-stock",
      "sortOrder": 10
    }
  ],
  "evidenceTopics": [
    {
      "key": "trunk-road-network-access",
      "lensKey": "regional-access",
      "title": "幹線道路ネットワークと地域アクセス",
      "question": "高速道路の延長と道路密度には、広域移動を支えるネットワークの地域差がどう表れるか",
      "summary": "高速道路延長と面積当たり道路延長を分け、道路網の総量と地域内の密度を読み比べます。",
      "sourceKeys": [
        "mlit-whitepaper-2025-road-network"
      ],
      "relatedRankingKeys": [
        "road-expressway-length",
        "road-length-per-km2",
        "average-road-traffic-volume"
      ],
      "relatedChartKeys": [
        "roads-length-trend"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "road-stock-maintenance",
      "lensKey": "sustainability",
      "title": "道路ストックの規模と維持管理",
      "question": "道路実延長と舗装率を合わせると、維持対象の規模と整備水準をどう読み分けられるか",
      "summary": "延長は維持対象の規模、舗装率は整備水準を示します。延長だけで老朽化の程度は判断しません。",
      "sourceKeys": [
        "mlit-whitepaper-2025-infrastructure-maintenance"
      ],
      "relatedRankingKeys": [
        "road-total-length-with-expressway",
        "main-road-paving-rate"
      ],
      "relatedChartKeys": [
        "roads-length-trend"
      ],
      "relatedThemeKeys": [
        "local-finance"
      ]
    }
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
  ],
  "sections": [
    {
      "key": "road-stock",
      "title": "道路ストックの規模と密度",
      "description": "道路総延長と総面積1km²当たり道路実延長を分けて比較します。総延長は高速道路を含み、密度の分母は可住地面積ではなく総面積です。",
      "metricGroupKeys": [
        "road-stock",
        "road-density"
      ],
      "chartKeys": [
        "roads-length-trend"
      ]
    },
    {
      "key": "expressways",
      "title": "高速道路ネットワーク",
      "description": "高速道路は道路総延長の一部です。両者を足して道路全体の長さにはできません。",
      "metricGroupKeys": [
        "expressways"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "highway"
      ]
    },
    {
      "key": "condition-use",
      "title": "整備水準と利用状況",
      "description": "舗装率と交通量は整備状態と利用状況の別の側面です。",
      "metricGroupKeys": [
        "condition-use-1",
        "condition-use-2"
      ],
      "chartKeys": []
    }
  ],
  "metricGroups": [
    {
      "key": "road-stock",
      "title": "道路総延長",
      "rankingKeys": [
        "road-total-length-with-expressway"
      ],
      "defaultCheckedKeys": [
        "road-total-length-with-expressway"
      ]
    },
    {
      "key": "road-density",
      "title": "道路実延長（総面積1km²当たり）",
      "rankingKeys": [
        "road-length-per-km2"
      ],
      "defaultCheckedKeys": [
        "road-length-per-km2"
      ]
    },
    {
      "key": "expressways",
      "title": "高速道路ネットワーク",
      "rankingKeys": [
        "road-expressway-length"
      ],
      "defaultCheckedKeys": [
        "road-expressway-length"
      ]
    },
    {
      "key": "condition-use-1",
      "title": "主要道路舗装率",
      "rankingKeys": [
        "main-road-paving-rate"
      ],
      "defaultCheckedKeys": [
        "main-road-paving-rate"
      ]
    },
    {
      "key": "condition-use-2",
      "title": "道路平均交通量（昼間12時間）",
      "rankingKeys": [
        "average-road-traffic-volume"
      ],
      "defaultCheckedKeys": [
        "average-road-traffic-volume"
      ]
    }
  ]
};
