import type { ThemeCatalog } from "./types";

export const LOCAL_FINANCE_CATALOG: ThemeCatalog = {
  "key": "local-finance",
  "title": "地方財政",
  "description": "都道府県別の財政力指数・経常収支比率・実質公債費比率・歳出構造をランキングとチャートで比較。地方税割合、交付税依存度、将来負担比率など主要財政指標の推移を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "primary"
    },
    {
      "rankingKey": "current-balance-ratio",
      "shortLabel": "経常収支比率",
      "role": "secondary"
    },
    {
      "rankingKey": "real-public-debt-service-ratio",
      "shortLabel": "実質公債費比率",
      "role": "secondary"
    },
    {
      "rankingKey": "future-burden-ratio",
      "shortLabel": "将来負担比率",
      "role": "secondary"
    },
    {
      "rankingKey": "real-balance-ratio",
      "shortLabel": "実質収支比率",
      "role": "secondary"
    },
    {
      "rankingKey": "local-tax-ratio-pref-finance",
      "shortLabel": "地方税割合",
      "role": "secondary"
    },
    {
      "rankingKey": "local-allocation-tax-ratio-pref-finance",
      "shortLabel": "交付税割合",
      "role": "secondary"
    },
    {
      "rankingKey": "national-treasury-disbursement-ratio-pref-finance",
      "shortLabel": "国庫支出金割合",
      "role": "secondary"
    },
    {
      "rankingKey": "self-financing-ratio",
      "shortLabel": "自主財源割合",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-total-expenditure-pref-municipal",
      "shortLabel": "1人当たり歳出",
      "role": "secondary"
    },
    {
      "rankingKey": "personnel-expenditure-ratio-pref-finance",
      "shortLabel": "人件費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "assistance-expenditure-ratio-pref-finance",
      "shortLabel": "扶助費割合",
      "role": "context"
    },
    {
      "rankingKey": "investment-expenditure-ratio-pref-finance",
      "shortLabel": "投資的経費割合",
      "role": "context"
    },
    {
      "rankingKey": "welfare-expenditure-ratio-pref-finance",
      "shortLabel": "民生費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "education-expenditure-ratio-pref-finance",
      "shortLabel": "教育費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "public-works-expenditure-ratio-pref-finance",
      "shortLabel": "土木費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-inhabitant-tax-pref-municipal",
      "shortLabel": "住民税",
      "role": "secondary"
    },
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税所得",
      "role": "secondary"
    },
    {
      "rankingKey": "taxpayer-ratio-per-pref-resident",
      "shortLabel": "納税義務者割合",
      "role": "secondary"
    },
    {
      "rankingKey": "laspeyres-index-prefecture",
      "shortLabel": "ラスパイレス指数",
      "role": "secondary"
    }
  ],
  "charts": [
    {
      "componentKey": "kpi-lf-fiscal-strength",
      "componentType": "kpi-card",
      "title": "財政力指数",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fiscal-strength-index-prefecture"
          }
        ]
      },
      "relatedRankingKeys": [
        "fiscal-strength-index-prefecture"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 1
    },
    {
      "componentKey": "kpi-lf-current-balance",
      "componentType": "kpi-card",
      "title": "経常収支比率",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "current-balance-ratio"
          }
        ],
        "unit": "％"
      },
      "relatedRankingKeys": [
        "current-balance-ratio"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 2
    },
    {
      "componentKey": "kpi-lf-debt-service",
      "componentType": "kpi-card",
      "title": "実質公債費比率",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "real-public-debt-service-ratio"
          }
        ],
        "unit": "％"
      },
      "relatedRankingKeys": [
        "real-public-debt-service-ratio"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 3
    },
    {
      "componentKey": "kpi-lf-future-burden",
      "componentType": "kpi-card",
      "title": "将来負担比率",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "future-burden-ratio"
          }
        ],
        "unit": "％"
      },
      "relatedRankingKeys": [
        "future-burden-ratio"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 4
    },
    {
      "componentKey": "theme-lf-fiscal-ratios-trend",
      "componentType": "line-chart",
      "title": "財政力指数・経常収支比率の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fiscal-strength-index-prefecture"
          },
          {
            "metricKey": "current-balance-ratio"
          }
        ],
        "labels": [
          "財政力指数",
          "経常収支比率"
        ],
        "seriesColors": [
          "population",
          "series-6"
        ]
      },
      "relatedRankingKeys": [
        "fiscal-strength-index-prefecture",
        "current-balance-ratio"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-lf-revenue-composition",
      "componentType": "composition-chart",
      "title": "歳入構成（地方税・交付税・国庫支出金）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "local-tax-ratio-pref-finance",
            "label": "地方税割合",
            "colorRole": "population"
          },
          {
            "metricKey": "local-allocation-tax-ratio-pref-finance",
            "label": "交付税割合",
            "colorRole": "series-6"
          },
          {
            "metricKey": "national-treasury-disbursement-ratio-pref-finance",
            "label": "国庫支出金割合",
            "colorRole": "special"
          }
        ]
      },
      "relatedRankingKeys": [
        "local-tax-ratio-pref-finance",
        "local-allocation-tax-ratio-pref-finance",
        "national-treasury-disbursement-ratio-pref-finance"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "歳入構造",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-lf-expense-composition",
      "componentType": "composition-chart",
      "title": "歳出構成（目的別）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "personnel-expenditure-ratio-pref-finance",
            "label": "人件費割合",
            "colorRole": "danger"
          },
          {
            "metricKey": "welfare-expenditure-ratio-pref-finance",
            "label": "民生費割合",
            "colorRole": "female"
          },
          {
            "metricKey": "education-expenditure-ratio-pref-finance",
            "label": "教育費割合",
            "colorRole": "population"
          },
          {
            "metricKey": "public-works-expenditure-ratio-pref-finance",
            "label": "土木費割合",
            "colorRole": "series-12"
          }
        ]
      },
      "relatedRankingKeys": [
        "personnel-expenditure-ratio-pref-finance",
        "welfare-expenditure-ratio-pref-finance",
        "education-expenditure-ratio-pref-finance",
        "public-works-expenditure-ratio-pref-finance"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "歳出構造",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-lf-income-tax-trend",
      "componentType": "line-chart",
      "title": "1人当たり住民税・課税対象所得の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "per-capita-inhabitant-tax-pref-municipal"
          },
          {
            "metricKey": "per-taxpayer-taxable-income"
          }
        ],
        "labels": [
          "1人当たり住民税",
          "納税義務者1人当たり課税所得"
        ],
        "seriesColors": [
          "series-6",
          "special"
        ]
      },
      "relatedRankingKeys": [
        "per-capita-inhabitant-tax-pref-municipal",
        "per-taxpayer-taxable-income"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "税収・所得",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-lf-debt-trend",
      "componentType": "line-chart",
      "title": "実質公債費比率・将来負担比率の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "real-public-debt-service-ratio"
          },
          {
            "metricKey": "future-burden-ratio"
          }
        ],
        "labels": [
          "実質公債費比率",
          "将来負担比率"
        ],
        "seriesColors": [
          "danger",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "real-public-debt-service-ratio",
        "future-burden-ratio"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "財政健全度",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-lf-revenue-trend",
      "componentType": "line-chart",
      "title": "歳入構造比率の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "local-tax-ratio-pref-finance"
          },
          {
            "metricKey": "local-allocation-tax-ratio-pref-finance"
          },
          {
            "metricKey": "national-treasury-disbursement-ratio-pref-finance"
          }
        ],
        "labels": [
          "地方税割合",
          "地方交付税割合",
          "国庫支出金割合"
        ],
        "seriesColors": [
          "population",
          "series-6",
          "special"
        ]
      },
      "relatedRankingKeys": [
        "local-tax-ratio-pref-finance",
        "local-allocation-tax-ratio-pref-finance",
        "national-treasury-disbursement-ratio-pref-finance"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "歳入構造",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-lf-per-capita-expense-trend",
      "componentType": "line-chart",
      "title": "1人当たり歳出決算総額の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "per-capita-total-expenditure-pref-municipal"
          }
        ],
        "labels": [
          "1人当たり歳出"
        ],
        "seriesColors": [
          "population"
        ]
      },
      "relatedRankingKeys": [
        "per-capita-total-expenditure-pref-municipal"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "歳出構造",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-lf-taxpayer-ratio-trend",
      "componentType": "line-chart",
      "title": "納税義務者割合の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "taxpayer-ratio-per-pref-resident"
          }
        ],
        "labels": [
          "納税義務者割合"
        ],
        "seriesColors": [
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "taxpayer-ratio-per-pref-resident"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "税収・所得",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-lf-expense-nature-trend",
      "componentType": "line-chart",
      "title": "性質別歳出割合の推移（人件費・扶助費・投資的経費）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "personnel-expenditure-ratio-pref-finance",
            "label": "人件費割合",
            "colorRole": "population"
          },
          {
            "metricKey": "assistance-expenditure-ratio-pref-finance",
            "label": "扶助費割合",
            "colorRole": "danger"
          },
          {
            "metricKey": "investment-expenditure-ratio-pref-finance",
            "label": "投資的経費割合",
            "colorRole": "improve"
          }
        ]
      },
      "relatedRankingKeys": [
        "personnel-expenditure-ratio-pref-finance",
        "assistance-expenditure-ratio-pref-finance",
        "investment-expenditure-ratio-pref-finance"
      ],
      "sourceName": "総務省「地方財政状況調査」",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 30
    }
  ],
  "evidenceTopics": [
    {
      "key": "revenue-base-and-equalization",
      "lensKey": "composition",
      "title": "自主財源と財源調整の構成",
      "question": "地方税と地方交付税の構成は、地域の財源基盤の違いをどう補っているか。",
      "summary": "財政力指数と歳入構成を組み合わせて読みます。地方税割合と地方交付税割合は歳入総額を分母とする構成比であり、割合だけで財政余力や税負担の大きさは判断できません。",
      "sourceKeys": [
        "mic-local-finance-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fiscal-strength-index-prefecture",
        "local-tax-ratio-pref-finance",
        "local-allocation-tax-ratio-pref-finance"
      ],
      "relatedChartKeys": [
        "theme-lf-fiscal-ratios-trend",
        "theme-lf-revenue-composition"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "debt-burden-and-soundness",
      "lensKey": "sustainability",
      "title": "公債費と将来負担の持続可能性",
      "question": "現在の公債費負担と将来負担は、地域の財政運営にどのような制約を与えるか。",
      "summary": "実質公債費比率と将来負担比率は、対象期間と算定対象が異なる健全化判断比率です。関連ランキングは2022年度、確報資料は2023年度決算のため、同一年の値として比較しません。",
      "sourceKeys": [
        "mic-fiscal-soundness-ratios-fy2023"
      ],
      "relatedRankingKeys": [
        "real-public-debt-service-ratio",
        "future-burden-ratio"
      ],
      "relatedChartKeys": [
        "theme-lf-debt-trend"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "地方財政",
    "財政力指数",
    "経常収支比率",
    "実質公債費比率",
    "将来負担比率",
    "地方税",
    "地方交付税",
    "歳出構造",
    "都道府県",
    "ランキング"
  ]
};
