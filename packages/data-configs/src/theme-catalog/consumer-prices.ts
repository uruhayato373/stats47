import type { ThemeCatalog } from "./types";

export const CONSUMER_PRICES_CATALOG: ThemeCatalog = {
  "key": "consumer-prices",
  "title": "物価・消費",
  "description": "全国を100とする消費者物価地域差指数から、同じ年の総合水準と費目別の価格差を比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "総合",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "総合は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "家賃除く総合",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "家賃除く総合は「総合水準と家賃の影響」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "食料",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "食料は「何の費目が高いか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "住居",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "住居は「何の費目が高いか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-utilities",
      "shortLabel": "光熱・水道",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "光熱・水道は「何の費目が高いか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-education",
      "shortLabel": "教育",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "教育は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-culture-recreation",
      "shortLabel": "教養娯楽",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "教養娯楽は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-transport-communication",
      "shortLabel": "交通・通信",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "交通・通信は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-healthcare",
      "shortLabel": "保健医療",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "保健医療は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-clothing-footwear",
      "shortLabel": "被服",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "被服は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-furniture-household",
      "shortLabel": "家具",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "家具は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-miscellaneous",
      "shortLabel": "諸雑費",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "諸雑費は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-cpi-profile",
      "componentType": "cpi-profile",
      "title": "物価プロファイル",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "consumer-price-difference-index-overall",
            "label": "総合",
            "colorRole": "series-1"
          },
          {
            "metricKey": "consumer-price-difference-index-overall-excl-rent",
            "label": "家賃除く総合",
            "colorRole": "series-2"
          },
          {
            "metricKey": "consumer-price-difference-index-food",
            "label": "食料",
            "colorRole": "series-3"
          },
          {
            "metricKey": "consumer-price-difference-index-housing",
            "label": "住居",
            "colorRole": "series-4"
          },
          {
            "metricKey": "consumer-price-difference-index-utilities",
            "label": "光熱・水道",
            "colorRole": "series-5"
          },
          {
            "metricKey": "consumer-price-difference-index-education",
            "label": "教育",
            "colorRole": "series-6"
          },
          {
            "metricKey": "consumer-price-difference-index-culture-recreation",
            "label": "教養娯楽",
            "colorRole": "series-7"
          },
          {
            "metricKey": "consumer-price-difference-index-transport-communication",
            "label": "交通・通信",
            "colorRole": "series-8"
          },
          {
            "metricKey": "consumer-price-difference-index-healthcare",
            "label": "保健医療",
            "colorRole": "series-9"
          },
          {
            "metricKey": "consumer-price-difference-index-clothing-footwear",
            "label": "被服",
            "colorRole": "series-10"
          },
          {
            "metricKey": "consumer-price-difference-index-furniture-household",
            "label": "家具",
            "colorRole": "series-11"
          },
          {
            "metricKey": "consumer-price-difference-index-miscellaneous",
            "label": "諸雑費",
            "colorRole": "series-12"
          }
        ]
      },
      "relatedRankingKeys": [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-overall-excl-rent",
        "consumer-price-difference-index-food",
        "consumer-price-difference-index-housing",
        "consumer-price-difference-index-utilities",
        "consumer-price-difference-index-education",
        "consumer-price-difference-index-culture-recreation",
        "consumer-price-difference-index-transport-communication",
        "consumer-price-difference-index-healthcare",
        "consumer-price-difference-index-clothing-footwear",
        "consumer-price-difference-index-furniture-household",
        "consumer-price-difference-index-miscellaneous"
      ],
      "sourceName": "小売物価統計調査（構造編）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "expenses",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-cpi-heatmap",
      "componentType": "line-chart",
      "title": "物価地域差指数（総合）の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "consumer-price-difference-index-overall",
            "label": "総合"
          }
        ]
      },
      "relatedRankingKeys": [
        "consumer-price-difference-index-overall"
      ],
      "sourceName": "小売物価統計調査（構造編）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "historical-change",
      "sortOrder": 20,
      "annotation": "複数年を収録する総合指数を表示します。費目別の単年指数は物価プロファイルで確認できます。"
    },
    {
      "componentKey": "md-cpi-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "全国を100とした同じ年の地域間の価格差です。前年比の物価上昇率とは異なります。\n\n費目ごとの価格差を同じ年で比較します。指数を足して家計の生活費総額にはできません。\n\n複数年を収録する総合指数の推移を確認します。単年の費目別指数は過去へ延長しません。"
      },
      "sourceName": "経済財政白書 (令和7年度版) / 男女共同参画白書 (令和7年版) / 小売物価統計調査 — 総務省統計局",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    },
    {
      "componentKey": "md-cpi-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 総合水準と家賃の影響を見るときの注意は？\n\n全国を100とした同じ年の地域間の価格差です。前年比の物価上昇率とは異なります。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n物価の水準差と家計が実際に支払う額は区別します。"
      },
      "sourceName": "経済財政白書 (令和7年度版) / 小売物価統計調査 — 総務省統計局 / 毎月勤労統計調査 — 厚生労働省",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 40
    }
  ],
  "evidenceTopics": [
    {
      "key": "overall-price-level-and-rent",
      "lensKey": "composition",
      "title": "総合物価水準と家賃の影響",
      "question": "総合と家賃を除く総合の地域差指数には、どのような違いが表れるか",
      "summary": "地域差指数は全国平均の価格水準を100とする相対指数で、前年からの物価上昇率ではありません。総合にも持家の帰属家賃は含まれず、家賃を除く総合では実際の家賃も除かれます。",
      "sourceKeys": [
        "stat-retail-price-survey-structural"
      ],
      "relatedRankingKeys": [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-overall-excl-rent"
      ],
      "relatedChartKeys": [
        "theme-cpi-profile"
      ]
    },
    {
      "key": "essential-cost-profile",
      "lensKey": "composition",
      "title": "食料・住居・光熱水道の価格構造",
      "question": "食料、住居、光熱・水道の価格水準には、地域ごとにどのような違いがあるか",
      "summary": "費目別指数は、それぞれの全国平均を100とする価格水準です。家計が実際に支払った金額や支出割合ではなく、費目間の指数を足したり単純平均したりして総合指数を作ることはできません。",
      "sourceKeys": [
        "stat-retail-price-survey-structural"
      ],
      "relatedRankingKeys": [
        "consumer-price-difference-index-food",
        "consumer-price-difference-index-housing",
        "consumer-price-difference-index-utilities"
      ],
      "relatedChartKeys": []
    }
  ],
  "keywords": [
    "消費者物価指数",
    "物価",
    "地域差指数",
    "生活コスト",
    "食費",
    "家賃",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "overall",
      "title": "総合水準と家賃の影響",
      "description": "全国を100とした同じ年の地域間の価格差です。前年比の物価上昇率とは異なります。",
      "metricGroupKeys": [
        "overall"
      ],
      "chartKeys": []
    },
    {
      "key": "expenses",
      "title": "何の費目が高いか",
      "description": "費目ごとの価格差を同じ年で比較します。指数を足して家計の生活費総額にはできません。",
      "metricGroupKeys": [
        "expenses"
      ],
      "chartKeys": [
        "theme-cpi-profile"
      ]
    },
    {
      "key": "historical-change",
      "title": "地域差の構造は変わったか",
      "description": "複数年を収録する総合指数の推移を確認します。単年の費目別指数は過去へ延長しません。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-cpi-heatmap"
      ]
    },
    {
      "key": "reading",
      "title": "読み方と実質収入",
      "description": "物価の水準差と家計が実際に支払う額は区別します。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-cpi-discussion",
        "md-cpi-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "overall",
      "title": "総合水準と家賃の影響",
      "rankingKeys": [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-overall-excl-rent"
      ],
      "defaultCheckedKeys": [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-overall-excl-rent"
      ]
    },
    {
      "key": "expenses",
      "title": "何の費目が高いか",
      "rankingKeys": [
        "consumer-price-difference-index-food",
        "consumer-price-difference-index-housing",
        "consumer-price-difference-index-utilities"
      ],
      "defaultCheckedKeys": [
        "consumer-price-difference-index-food",
        "consumer-price-difference-index-housing"
      ]
    }
  ]
};
