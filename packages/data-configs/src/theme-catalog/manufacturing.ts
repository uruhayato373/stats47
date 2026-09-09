import type { ThemeCatalog } from "./types";

export const MANUFACTURING_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "出荷規模・付加価値・雇用と、1人当たりの出荷額を比較します。",
    "headlineRankingKeys": [
      "manufacturing-shipment-amount",
      "manufacturing-shipment-amount-per-employee",
      "manufacturing-employees",
      "manufacturing-industry-added-value"
    ],
    "comparisonRankingKeys": [
      "manufacturing-shipment-amount-per-employee",
      "manufacturing-shipment-amount",
      "manufacturing-industry-added-value",
      "manufacturing-employees",
      "manufacturing-establishments",
      "manufacturing-shipment-amount-per-establishment"
    ],
    "mapNotes": {
      "manufacturing-shipment-amount-per-employee": "従業者1人当たりの出荷額。賃金・利益・付加価値生産性ではありません。",
      "manufacturing-shipment-amount": "製造品出荷額等の総額。地域の製造業規模を示します。",
      "manufacturing-industry-added-value": "事業所が生み出す価値の総額。従業者規模により付加価値の算式が異なります。",
      "manufacturing-employees": "製造業事業所の従業者数。職種別就業者数とは異なります。",
      "manufacturing-establishments": "製造業の事業所総数。法人企業数や人口当たりの密度ではありません。",
      "manufacturing-shipment-amount-per-establishment": "1事業所当たりの出荷額。事業所規模の違いを含みます。"
    }
  },
  "key": "manufacturing",
  "title": "製造業",
  "description": "都道府県別の製造品出荷額・付加価値額・事業所数・従業者数をランキングとチャートで比較。製造業の地域差を47都道府県のデータで確認できます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "manufacturing-shipment-amount",
      "shortLabel": "出荷額",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「産業別製造品出荷額及び付加価値額」",
        "sourceUrl": "https://www.stat.go.jp/library/faq/faq08/faq08b02.html",
        "surveyedAt": "2026-09-09",
        "rationale": "製造業の生産・出荷の総規模を上部で把握する。"
      }
    },
    {
      "rankingKey": "manufacturing-industry-added-value",
      "shortLabel": "付加価値額",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「産業別製造品出荷額及び付加価値額」",
        "sourceUrl": "https://www.stat.go.jp/library/faq/faq08/faq08b02.html",
        "surveyedAt": "2026-09-09",
        "rationale": "出荷の総額と、原材料等を控除して生み出す価値を区別する。"
      }
    },
    {
      "rankingKey": "manufacturing-establishments",
      "shortLabel": "事業所数",
      "role": "secondary",
      "selection": {
        "proposedBy": "総務省「産業別製造品出荷額及び付加価値額」",
        "sourceUrl": "https://www.stat.go.jp/library/faq/faq08/faq08b02.html",
        "surveyedAt": "2026-09-09",
        "rationale": "生産拠点数を比較表と推移で補足する。"
      }
    },
    {
      "rankingKey": "manufacturing-employees",
      "shortLabel": "従業者数",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「産業別製造品出荷額及び付加価値額」",
        "sourceUrl": "https://www.stat.go.jp/library/faq/faq08/faq08b02.html",
        "surveyedAt": "2026-09-09",
        "rationale": "生産に対応する雇用規模を上部で併記する。"
      }
    },
    {
      "rankingKey": "manufacturing-establishment-site-area",
      "shortLabel": "敷地面積",
      "role": "context"
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-employee",
      "shortLabel": "出荷額/人",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「産業別製造品出荷額及び付加価値額」",
        "sourceUrl": "https://www.stat.go.jp/library/faq/faq08/faq08b02.html",
        "surveyedAt": "2026-09-09",
        "rationale": "規模の大きい県だけが目立つことを避け、登録済みの従業者当たり出荷額を併置する。付加価値生産性とは表現しない。"
      }
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-establishment",
      "shortLabel": "出荷額/所",
      "role": "secondary",
      "selection": {
        "proposedBy": "総務省「産業別製造品出荷額及び付加価値額」",
        "sourceUrl": "https://www.stat.go.jp/library/faq/faq08/faq08b02.html",
        "surveyedAt": "2026-09-09",
        "rationale": "事業所の平均的な出荷規模を比較表で補足し、人員当たりの指標と分母を区別する。"
      }
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
        "seriesRefs": [
          {
            "metricKey": "manufacturing-establishments"
          },
          {
            "metricKey": "manufacturing-employees"
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
      "sortOrder": 0,
      "annotation": "調査変更をまたぐ比較に注意。出荷額の対象期間と人数・事業所数の調査時点も異なります。"
    },
    {
      "componentKey": "manufacturing-shipment-value-trend",
      "componentType": "line-chart",
      "title": "製造品出荷額と付加価値額の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "manufacturing-shipment-amount"
          },
          {
            "metricKey": "manufacturing-industry-added-value"
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
      "sortOrder": 1,
      "annotation": "2020年度以降は調査・対象範囲が年により異なります。段差を同条件の増減とはみなせません。"
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
      "relatedChartKeys": [],
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
