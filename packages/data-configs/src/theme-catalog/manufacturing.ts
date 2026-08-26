import type { ThemeCatalog } from "./types";

export const MANUFACTURING_CATALOG: ThemeCatalog = {
  "key": "manufacturing",
  "title": "製造業",
  "description": "都道府県別の製造品出荷額・付加価値額・事業所数・従業者数をランキングとチャートで比較。製造業の地域差を47都道府県のデータで確認できます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "manufacturing-shipment-amount",
      "shortLabel": "出荷額",
      "role": "primary"
    },
    {
      "rankingKey": "manufacturing-industry-added-value",
      "shortLabel": "付加価値額",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-establishments",
      "shortLabel": "事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-employees",
      "shortLabel": "従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-establishment-site-area",
      "shortLabel": "敷地面積",
      "role": "context"
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-employee",
      "shortLabel": "出荷額/人",
      "role": "secondary"
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-establishment",
      "shortLabel": "出荷額/所",
      "role": "context"
    },
    {
      "rankingKey": "industrial-land-price-change-rate",
      "shortLabel": "工業地価変動率",
      "role": "context"
    },
    {
      "rankingKey": "industrial-water-usage",
      "shortLabel": "工業用水量",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "manufacturing-establishments-employees-trend",
      "componentType": "line-chart",
      "title": "事業所数と従業者数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3403"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3404"
          }
        ],
        "labels": [
          "事業所数",
          "従業者数"
        ],
        "seriesColors": [
          "count",
          "special"
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-establishments",
        "manufacturing-employees"
      ],
      "sourceName": "工業統計調査 / 経済センサス",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "section": "事業所・雇用",
      "sortOrder": 0
    },
    {
      "componentKey": "manufacturing-shipment-value-trend",
      "componentType": "line-chart",
      "title": "製造品出荷額と付加価値額の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3401"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3402"
          }
        ],
        "labels": [
          "出荷額等",
          "付加価値額"
        ],
        "seriesColors": [
          "population",
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-shipment-amount",
        "manufacturing-industry-added-value"
      ],
      "sourceName": "工業統計調査 / 経済センサス",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "section": "生産規模",
      "sortOrder": 1
    },
    {
      "componentKey": "theme-manufacturing-labor-productivity",
      "componentType": "line-chart",
      "title": "製造業の労働生産性の推移（従業者1人あたり・事業所1あたり出荷額）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010203",
            "cdCat01": "#C04401"
          },
          {
            "statsDataId": "0000010203",
            "cdCat01": "#C04404"
          }
        ],
        "labels": [
          "従業者1人あたり出荷額",
          "事業所1あたり出荷額"
        ],
        "seriesColors": [
          "population",
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-shipment-amount-per-employee",
        "manufacturing-shipment-amount-per-establishment"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 100
    }
  ],
  "evidenceTopics": [
    {
      "key": "production-base-capacity",
      "lensKey": "service-capacity",
      "title": "生産拠点と雇用の地域基盤",
      "question": "事業所数と従業者数は、地域の製造基盤としてどのように推移しているか。",
      "summary": "事業所数と従業者数を並べると、生産拠点の量と雇用規模の変化を読み分けられます。職種別の人手不足や技能水準までは、この2指標だけでは示しません。",
      "sourceKeys": [
        "meti-monodzukuri-whitepaper-2026"
      ],
      "relatedRankingKeys": [
        "manufacturing-establishments",
        "manufacturing-employees"
      ],
      "relatedChartKeys": [
        "manufacturing-establishments-employees-trend"
      ],
      "relatedThemeKeys": [
        "labor-wages"
      ]
    },
    {
      "key": "shipment-per-worker",
      "lensKey": "outcomes",
      "title": "人員あたりの出荷規模",
      "question": "従業者1人あたりの製造品出荷額には、どのような地域差があるか。",
      "summary": "従業者1人あたり出荷額は、生産規模を人員数で割った比較です。付加価値額や利益を分子にする労働生産性とは定義が異なります。",
      "sourceKeys": [
        "meti-monodzukuri-whitepaper-2026"
      ],
      "relatedRankingKeys": [
        "manufacturing-shipment-amount-per-employee"
      ],
      "relatedChartKeys": [
        "theme-manufacturing-labor-productivity"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "製造業",
    "製造品出荷額",
    "付加価値額",
    "工場",
    "事業所",
    "都道府県",
    "ランキング"
  ]
};
