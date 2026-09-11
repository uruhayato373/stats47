import type { ThemeCatalog } from "./types";

export const TOURISM_CATALOG: ThemeCatalog = {
  "key": "tourism",
  "title": "観光",
  "description": "来訪者の宿泊需要、受入供給と利用率、交通アクセスの違いを把握する。",
  "category": "tourism",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-overnight-guests",
      "shortLabel": "延べ宿泊者数（総数）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "宿泊者数は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人延べ宿泊者数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "外国人宿泊は「宿泊需要はどれくらいか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "room-utilization-rate",
      "shortLabel": "客室稼働率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "客室稼働率は「宿泊施設と客室の使われ方」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-domestic-tourism",
      "shortLabel": "国内旅行率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "住民の旅行行動率で集客指標ではないためcontextへ格下げする。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-overseas",
      "shortLabel": "海外旅行率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "海外旅行率は「住民の旅行行動」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-overnight",
      "shortLabel": "宿泊旅行率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "宿泊旅行率は「住民の旅行行動」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "travel-participation-rate-day-trip",
      "shortLabel": "日帰り旅行率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "日帰り旅行率は「住民の旅行行動」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "air-passenger-transport",
      "shortLabel": "航空旅客",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "観光以外を含むアクセス補足に限り、主要KPIから外す。"
      }
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR旅客",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "JR旅客は「アクセスの背景」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "number-of-simple-lodging-facilities",
      "shortLabel": "簡易宿所数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "簡易宿所数は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "number-of-hotel-facilities",
      "shortLabel": "ホテル営業施設数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "公開最新2017年のため現状把握の主画面へ昇格しない。歴史参考として保持し更新後に再判定。"
      }
    },
    {
      "rankingKey": "number-of-hotel-rooms",
      "shortLabel": "ホテル客室数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "公開最新2017年のため現状把握の主画面へ昇格しない。歴史参考として保持し更新後に再判定。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-tourism-stay-trend",
      "componentType": "line-chart",
      "title": "延べ宿泊者数の推移（総数・外国人）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "total-overnight-guests",
            "label": "延べ宿泊者数（総数）"
          },
          {
            "metricKey": "total-overnight-guests-foreign",
            "label": "外国人延べ宿泊者数"
          }
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "total-overnight-guests",
        "total-overnight-guests-foreign"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "stays",
      "sortOrder": 10,
      "annotation": "総数には外国人を含みます。両系列を足すと外国人分が重複します。延べ宿泊者数は人泊で、実人数ではありません。"
    },
    {
      "componentKey": "theme-tourism-transport-trend",
      "componentType": "line-chart",
      "title": "航空旅客輸送量の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "air-passenger-transport"
          }
        ],
        "labels": [
          "航空旅客"
        ],
        "seriesColors": [
          "series-7"
        ]
      },
      "relatedRankingKeys": [
        "air-passenger-transport"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "transport",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-tourism-hotel-supply-trend",
      "componentType": "line-chart",
      "title": "宿泊施設数と客室数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "number-of-hotel-facilities",
            "label": "ホテル営業施設数",
            "colorRole": "population"
          },
          {
            "metricKey": "number-of-hotel-rooms",
            "label": "ホテル客室数",
            "colorRole": "count"
          }
        ]
      },
      "relatedRankingKeys": [
        "number-of-hotel-facilities",
        "number-of-hotel-rooms"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "accommodation",
      "sortOrder": 30
    }
  ],
  "evidenceTopics": [
    {
      "key": "domestic-and-inbound-stays",
      "lensKey": "participation",
      "title": "国内外の宿泊需要の地域集中",
      "question": "延べ宿泊者数と外国人延べ宿泊者数には、宿泊需要の地域的な集中がどう表れるか",
      "summary": "延べ宿泊者数は1人が複数泊すると泊数分を数えます。外国人延べ宿泊者数は総数の内数なので、両者を足さず、総需要と外国人需要の集中を分けて読みます。",
      "sourceKeys": [
        "jta-accommodation-survey"
      ],
      "relatedRankingKeys": [
        "total-overnight-guests",
        "total-overnight-guests-foreign"
      ],
      "relatedChartKeys": [
        "theme-tourism-stay-trend"
      ]
    }
  ],
  "keywords": [
    "観光",
    "宿泊者数",
    "インバウンド",
    "客室稼働率",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "stays",
      "title": "宿泊需要はどれくらいか",
      "description": "延べ宿泊者数は宿泊日数を含むため、訪問した実人数ではありません。",
      "metricGroupKeys": [
        "stays"
      ],
      "chartKeys": [
        "theme-tourism-stay-trend"
      ]
    },
    {
      "key": "accommodation",
      "title": "客室稼働率と宿泊供給の参考",
      "description": "客室稼働率と施設・客室数では対象年が異なります。施設・客室数は2017年までの過去参考です。",
      "metricGroupKeys": [
        "accommodation"
      ],
      "chartKeys": [
        "theme-tourism-hotel-supply-trend"
      ]
    },
    {
      "key": "transport",
      "title": "アクセスの背景",
      "description": "航空旅客数は観光以外の移動も含みます。観光客数の代わりにはなりません。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-tourism-transport-trend"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "stays",
      "title": "宿泊需要はどれくらいか",
      "rankingKeys": [
        "total-overnight-guests",
        "total-overnight-guests-foreign"
      ],
      "defaultCheckedKeys": [
        "total-overnight-guests",
        "total-overnight-guests-foreign"
      ]
    },
    {
      "key": "accommodation",
      "title": "客室稼働率と宿泊供給の参考",
      "rankingKeys": [
        "room-utilization-rate"
      ],
      "defaultCheckedKeys": [
        "room-utilization-rate"
      ]
    }
  ]
};
