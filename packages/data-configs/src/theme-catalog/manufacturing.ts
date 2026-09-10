import type { ThemeCatalog } from "./types";

export const MANUFACTURING_CATALOG: ThemeCatalog = {
  "key": "manufacturing",
  "title": "製造業",
  "description": "製造業の生産規模、拠点と雇用、人員当たりの出荷規模を比較する。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "manufacturing-shipment-amount",
      "shortLabel": "出荷額",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "出荷額は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "manufacturing-industry-added-value",
      "shortLabel": "付加価値額",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "付加価値額は「生産規模」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "manufacturing-establishments",
      "shortLabel": "事業所数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "事業所数は「拠点と雇用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "manufacturing-employees",
      "shortLabel": "従業者数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "従業者数は「拠点と雇用」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "manufacturing-establishment-site-area",
      "shortLabel": "敷地面積",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "敷地面積は「立地条件」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-employee",
      "shortLabel": "出荷額等（従業者1人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/C",
        "surveyedAt": "2026-09-08",
        "rationale": "従業者1人を基準にした製造品出荷額等として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "manufacturing-shipment-amount-per-establishment",
      "shortLabel": "出荷額等（1事業所当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/C",
        "surveyedAt": "2026-09-08",
        "rationale": "1事業所を基準にした製造品出荷額等として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "industrial-land-price-change-rate",
      "shortLabel": "工業地価変動率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "工業地価変動率は「立地条件」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "industrial-water-usage",
      "shortLabel": "工業用水量",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "工業用水量は「立地条件」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "manufacturing-establishments-employees-trend",
      "componentType": "line-chart",
      "title": "製造業の事業所数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "manufacturing-establishments",
            "label": "事業所数",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-establishments"
      ],
      "sourceName": "工業統計調査 / 経済センサス",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "section": "sites-employment"
    },
    {
      "componentKey": "manufacturing-establishments-employees-trend-employees",
      "componentType": "line-chart",
      "title": "製造業の従業者数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "manufacturing-employees",
            "label": "従業者数",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-employees"
      ],
      "sourceName": "工業統計調査 / 経済センサス",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 20,
      "section": "sites-employment"
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
      "section": "production",
      "sortOrder": 30,
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm"
    },
    {
      "componentKey": "theme-manufacturing-labor-productivity",
      "componentType": "line-chart",
      "title": "従業者1人当たり出荷額の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "manufacturing-shipment-amount-per-employee",
            "label": "出荷額等（従業者1人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-shipment-amount-per-employee"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 40,
      "annotation": "出荷額ベースの指標です。付加価値を用いる労働生産性とは異なります。",
      "section": "shipment-per-worker"
    },
    {
      "componentKey": "theme-manufacturing-labor-productivity-establishment",
      "componentType": "line-chart",
      "title": "事業所当たり出荷額の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "manufacturing-shipment-amount-per-establishment",
            "label": "出荷額等（1事業所当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "manufacturing-shipment-amount-per-establishment"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 50,
      "annotation": "事業所の出荷規模を示し、従業者1人当たりの指標とは分母が異なります。",
      "section": "location"
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
  ],
  "sections": [
    {
      "key": "production",
      "title": "生産規模",
      "description": "出荷額と付加価値額は別の概念です。金額は物価変動を含む名目値として読みます。",
      "metricGroupKeys": [
        "production"
      ],
      "chartKeys": [
        "manufacturing-shipment-value-trend"
      ]
    },
    {
      "key": "sites-employment",
      "title": "拠点と雇用",
      "description": "事業所数と従業者数を別の尺度で確認します。",
      "metricGroupKeys": [
        "sites-employment-1",
        "sites-employment-2"
      ],
      "chartKeys": [
        "manufacturing-establishments-employees-trend",
        "manufacturing-establishments-employees-trend-employees"
      ]
    },
    {
      "key": "shipment-per-worker",
      "title": "人員当たりの出荷規模",
      "description": "従業者1人当たり出荷額は、付加価値を使う労働生産性とは異なります。",
      "metricGroupKeys": [
        "shipment-per-worker"
      ],
      "chartKeys": [
        "theme-manufacturing-labor-productivity"
      ]
    },
    {
      "key": "location",
      "title": "立地条件",
      "description": "事業所当たり出荷額、敷地、地価、水利用は立地条件の補足です。水利用の対象年にも注意してください。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-manufacturing-labor-productivity-establishment"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "production",
      "title": "生産規模",
      "rankingKeys": [
        "manufacturing-shipment-amount",
        "manufacturing-industry-added-value"
      ],
      "defaultCheckedKeys": [
        "manufacturing-shipment-amount",
        "manufacturing-industry-added-value"
      ]
    },
    {
      "key": "sites-employment-1",
      "title": "事業所数",
      "rankingKeys": [
        "manufacturing-establishments"
      ],
      "defaultCheckedKeys": [
        "manufacturing-establishments"
      ]
    },
    {
      "key": "sites-employment-2",
      "title": "従業者数",
      "rankingKeys": [
        "manufacturing-employees"
      ],
      "defaultCheckedKeys": [
        "manufacturing-employees"
      ]
    },
    {
      "key": "shipment-per-worker",
      "title": "出荷額等（従業者1人当たり）",
      "rankingKeys": [
        "manufacturing-shipment-amount-per-employee"
      ],
      "defaultCheckedKeys": [
        "manufacturing-shipment-amount-per-employee"
      ]
    }
  ]
};
