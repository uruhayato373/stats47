import type { ThemeCatalog } from "./types";

// Migrated 2026-07-04 from IndicatorSet + page-components JSON (byte-exact round-trip verified).
export const REAL_INCOME_CATALOG: ThemeCatalog = {
  "key": "real-income",
  "title": "実質収入・購買力",
  "description": "都道府県別の名目収入を消費者物価地域差指数で補正し、実質的な購買力を比較。可処分所得・県民所得・家賃控除後手残りで「本当に豊かな県」を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "actual-income-worker-households-per-month",
      "shortLabel": "実収入",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "県民所得/人",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-income-per-household",
      "shortLabel": "世帯年収",
      "role": "context"
    },
    {
      "rankingKey": "real-disposable-income",
      "shortLabel": "実質可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "disposable-income-after-rent",
      "shortLabel": "家賃控除後手残り",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "CPI総合",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "CPI(家賃除く)",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "CPI(住居)",
      "role": "context"
    },
    {
      "rankingKey": "private-rental-housing-rent-per-3-3m2",
      "shortLabel": "家賃/3.3m²",
      "role": "context"
    },
    {
      "rankingKey": "private-rent-consumption-expenditure",
      "shortLabel": "家賃支出",
      "role": "context"
    }
  ],
  "panelTabs": [
    {
      "label": "名目収入",
      "rankingKeys": [
        "disposable-income-worker-households",
        "actual-income-worker-households-per-month",
        "per-capita-prefectural-income-h27",
        "annual-income-per-household"
      ]
    },
    {
      "label": "物価補正後",
      "rankingKeys": [
        "real-disposable-income",
        "disposable-income-after-rent"
      ]
    },
    {
      "label": "物価・家賃",
      "rankingKeys": [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-overall-excl-rent",
        "consumer-price-difference-index-housing",
        "private-rental-housing-rent-per-3-3m2",
        "private-rent-consumption-expenditure"
      ]
    }
  ],
  "charts": [
    {
      "componentKey": "real-income-nominal-income",
      "componentType": "line-chart",
      "title": "勤労者世帯 可処分所得の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010112",
            "cdCat01": "L3130"
          }
        ],
        "labels": [
          "可処分所得（勤労者世帯）"
        ],
        "seriesColors": [
          "#3b82f6"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "名目収入",
      "sortOrder": 0
    },
    {
      "componentKey": "real-income-cpi-breakdown",
      "componentType": "line-chart",
      "title": "消費者物価地域差指数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04414"
          },
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04417"
          },
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04416"
          }
        ],
        "labels": [
          "総合",
          "住居",
          "食料"
        ],
        "seriesColors": [
          "#6b7280",
          "#ef4444",
          "#f59e0b"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "物価・家賃",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-real-income-per-capita-prefectural",
      "componentType": "line-chart",
      "title": "1人あたり県民所得の推移（全国平均）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010203",
            "cdCat01": "#C01321"
          }
        ],
        "labels": [
          "1人あたり県民所得"
        ],
        "seriesColors": [
          "#22c55e"
        ]
      },
      "sourceName": "内閣府 県民経済計算",
      "sourceLink": null,
      "rankingLink": "/ranking/per-capita-prefectural-income-h27",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 100
    },
    {
      "componentKey": "theme-real-income-actual-vs-disposable",
      "componentType": "line-chart",
      "title": "勤労者世帯の実収入の推移（全国平均）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L01201"
          }
        ],
        "labels": [
          "実収入（月額）"
        ],
        "seriesColors": [
          "#3b82f6"
        ]
      },
      "sourceName": "総務省 家計調査",
      "sourceLink": null,
      "rankingLink": "/ranking/actual-income-worker-households-per-month",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 110
    }
  ],
  "keywords": [
    "実質年収",
    "実質購買力",
    "物価補正",
    "可処分所得",
    "家賃控除",
    "手残り",
    "都道府県",
    "ランキング"
  ]
};
