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
        "estatParams": {
          "statsDataId": "0000010104",
          "cdCat01": "D2101"
        }
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
        "estatParams": {
          "statsDataId": "0000010104",
          "cdCat01": "D2111"
        },
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
        "estatParams": {
          "statsDataId": "0000010104",
          "cdCat01": "D2112"
        },
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
        "estatParams": [
          {
            "statsDataId": "0000010104",
            "cdCat01": "D2101"
          },
          {
            "statsDataId": "0000010104",
            "cdCat01": "D2103"
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
        "statsDataId": "0000010204",
        "segments": [
          {
            "code": "#D0210101",
            "label": "地方税",
            "color": "population"
          },
          {
            "code": "#D0210201",
            "label": "地方交付税",
            "color": "series-6"
          },
          {
            "code": "#D0210301",
            "label": "国庫支出金",
            "color": "special"
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
        "statsDataId": "0000010204",
        "segments": [
          {
            "code": "#D0320101",
            "label": "人件費",
            "color": "danger"
          },
          {
            "code": "#D0310301",
            "label": "民生費",
            "color": "female"
          },
          {
            "code": "#D0311501",
            "label": "教育費",
            "color": "population"
          },
          {
            "code": "#D0311201",
            "label": "土木費",
            "color": "series-12"
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
        "estatParams": [
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0220103"
          },
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D02206"
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
        "estatParams": [
          {
            "statsDataId": "0000010104",
            "cdCat01": "D2111"
          },
          {
            "statsDataId": "0000010104",
            "cdCat01": "D2112"
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
        "estatParams": [
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0210101"
          },
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0210201"
          },
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0210301"
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
        "estatParams": [
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0330103"
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
        "estatParams": [
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D02207"
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
        "estatParams": [
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0320101"
          },
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0320201"
          },
          {
            "statsDataId": "0000010204",
            "cdCat01": "#D0140201"
          }
        ],
        "labels": [
          "人件費割合",
          "扶助費割合",
          "投資的経費割合"
        ],
        "seriesColors": [
          "population",
          "danger",
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "personnel-expenditure-ratio-pref-finance"
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
