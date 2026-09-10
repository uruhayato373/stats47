import type { ThemeCatalog } from "./types";

export const FISHERY_MARINE_CATALOG: ThemeCatalog = {
  "key": "fishery-marine",
  "title": "漁業（水産業）",
  "description": "漁獲・養殖の供給、産出額、担い手の規模を地域別に把握する。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fish-catch",
      "shortLabel": "漁獲量",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "漁獲量は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "marine-fishery-catch",
      "shortLabel": "海面漁獲量",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "海面漁獲量は「漁獲と養殖の供給」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "inland-fishery-catch",
      "shortLabel": "内水面漁獲量",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "内水面漁獲量は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishing-port-count-ksj",
      "shortLabel": "指定漁港総数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.jfa.maff.go.jp/j/gyoko_gyozyo/g_zyoho_bako/gyoko_itiran/sub81.html",
        "surveyedAt": "2026-09-08",
        "rationale": "指定漁港総数は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "aquaculture-harvest",
      "shortLabel": "養殖収獲量",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "養殖収獲量は「漁獲と養殖の供給」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "marine-aquaculture-harvest",
      "shortLabel": "海面養殖",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "海面養殖は「養殖の海面・内水面構造」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "inland-aquaculture-harvest",
      "shortLabel": "内水面養殖",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "内水面養殖は「養殖の海面・内水面構造」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "marine-fishery-aquaculture-output-value",
      "shortLabel": "産出額（新）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "産出額（新）は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "marine-fishery-output-value",
      "shortLabel": "海面漁業産出額",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "海面漁業産出額は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-output-value",
      "shortLabel": "産出額（旧）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "旧系列は長期接続を検証する参照用途のみ保持し最新KPIには採用しない。"
      }
    },
    {
      "rankingKey": "fishery-workers",
      "shortLabel": "漁業就業者",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "漁業就業者は「産出額と担い手」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-scallop",
      "shortLabel": "ホタテガイ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "ホタテガイは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-japanese-squid",
      "shortLabel": "スルメイカ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "スルメイカは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-tuna",
      "shortLabel": "マグロ類",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "マグロ類は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-bonito",
      "shortLabel": "カツオ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "カツオは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-mackerel",
      "shortLabel": "サバ類",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "サバ類は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-pacific-saury",
      "shortLabel": "サンマ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "サンマは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-yellowtail",
      "shortLabel": "ブリ類",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "ブリ類は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-sardine",
      "shortLabel": "イワシ類",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "イワシ類は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-pollock",
      "shortLabel": "スケトウダラ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "スケトウダラは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-kelp",
      "shortLabel": "コンブ類",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "コンブ類は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-snow-crab",
      "shortLabel": "ズワイガニ",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "ズワイガニは対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "fishery-species-catch-sea-bream",
      "shortLabel": "タイ類",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
        "surveyedAt": "2026-09-08",
        "rationale": "タイ類は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-fishery-catch-trend",
      "componentType": "line-chart",
      "title": "漁獲量と海面漁業漁獲量の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fish-catch"
          },
          {
            "metricKey": "marine-fishery-catch"
          }
        ],
        "labels": [
          "漁獲量（合計）",
          "海面漁獲量"
        ],
        "seriesColors": [
          "population",
          "series-6"
        ]
      },
      "relatedRankingKeys": [
        "fish-catch",
        "marine-fishery-catch"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "catch",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-fishery-aquaculture-mix",
      "componentType": "mixed-chart",
      "title": "海面・内水面養殖収獲量の推移",
      "componentProps": {
        "columnSeriesRefs": [
          {
            "metricKey": "marine-aquaculture-harvest"
          }
        ],
        "lineSeriesRefs": [
          {
            "metricKey": "inland-aquaculture-harvest"
          }
        ],
        "columnLabels": [
          "海面養殖収獲量"
        ],
        "lineLabels": [
          "内水面養殖収獲量"
        ],
        "leftUnit": "トン",
        "rightUnit": "トン",
        "columnColors": [
          "series-6"
        ],
        "lineColors": [
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "marine-aquaculture-harvest",
        "inland-aquaculture-harvest"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "aquaculture",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-fishery-output-trend",
      "componentType": "line-chart",
      "title": "海面漁業・養殖業産出額の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "marine-fishery-aquaculture-output-value",
            "label": "産出額（新）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "marine-fishery-aquaculture-output-value"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 30,
      "annotation": "海面漁業と養殖業を含む名目の産出額です。",
      "section": "output-workers"
    },
    {
      "componentKey": "theme-fishery-output-trend-marine",
      "componentType": "line-chart",
      "title": "海面漁業産出額の長期推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "marine-fishery-output-value",
            "label": "海面漁業産出額",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "marine-fishery-output-value"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 40,
      "annotation": "海面漁業のみの名目産出額です。養殖を含む系列とは対象が異なります。",
      "section": "output-workers"
    },
    {
      "componentKey": "theme-fishery-half-century",
      "componentType": "line-chart",
      "title": "漁業就業者数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fishery-workers",
            "label": "漁業就業者",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "fishery-workers"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 50,
      "annotation": "漁獲量とは別の尺度で、漁業を担う人員の変化を確認します。",
      "section": "output-workers"
    }
  ],
  "evidenceTopics": [
    {
      "key": "aquaculture-supply-shift",
      "lensKey": "sustainability",
      "title": "漁獲と養殖の供給構造",
      "question": "漁獲量と養殖収獲量の推移には、どのような地域差があるか。",
      "summary": "漁獲と養殖を別系列で追うと、水産物の生産構造の違いを確認できます。資源量の健全性や需要、採算性を直接示す指標ではありません。",
      "sourceKeys": [
        "jfa-fisheries-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fish-catch",
        "aquaculture-harvest"
      ],
      "relatedChartKeys": [
        "theme-fishery-catch-trend",
        "theme-fishery-aquaculture-mix"
      ],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "fishery-workforce-continuity",
      "lensKey": "service-capacity",
      "title": "漁業の担い手と地域の継続性",
      "question": "漁業就業者数の長期変化は、地域の担い手基盤をどう映しているか。",
      "summary": "漁業就業者数の長期推移から担い手規模の変化を確認できます。新規就業者数、年齢構成、兼業状況はこの系列に含まれません。",
      "sourceKeys": [
        "jfa-fisheries-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fishery-workers"
      ],
      "relatedChartKeys": [
        "theme-fishery-half-century"
      ],
      "relatedThemeKeys": [
        "aging-society"
      ]
    },
    {
      "key": "fish-consumption-east-west",
      "lensKey": "composition",
      "title": "生鮮魚介の好みは産地ではなく消費地で分かれる",
      "question": "家庭で買う生鮮魚介の支出額を品目別に並べると、県庁所在市はどのような地域のまとまりに分かれるか",
      "summary": "漁獲量が多い産地と、家庭でよく買う消費地は一致しない。太平洋側・東日本はまぐろ・さけ・さんま、日本海側・西日本はぶり・さば・かれい・たい・あじの支出が相対的に大きい。値は県庁所在市の二人以上世帯で、外食は含まない。",
      "sourceKeys": [
        "stat-family-income-expenditure-survey-2024"
      ],
      "relatedRankingKeys": [
        "tuna-consumption-expenditure",
        "yellowtail-consumption-expenditure",
        "saury-consumption-expenditure",
        "bonito-consumption-expenditure",
        "oyster-consumption-expenditure",
        "mackerel-consumption-expenditure",
        "fishery-species-catch-tuna",
        "fishery-species-catch-yellowtail"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "tourism",
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "漁業",
    "水産業",
    "漁獲量",
    "養殖",
    "漁業就業者",
    "漁業産出額",
    "漁港",
    "海面漁業",
    "内水面漁業",
    "都道府県",
    "ランキング"
  ],
  "relatedArticleTagKeys": [
    "fishery",
    "fish-catch",
    "aquaculture",
    "fisheries-industry"
  ],
  "sections": [
    {
      "key": "catch",
      "title": "漁獲と養殖の供給",
      "description": "漁獲と養殖の対象範囲を確認します。海のない県など対象外の値を0に置き換えて比較しません。",
      "metricGroupKeys": [
        "catch"
      ],
      "chartKeys": [
        "theme-fishery-catch-trend"
      ]
    },
    {
      "key": "aquaculture",
      "title": "養殖の海面・内水面構造",
      "description": "海面と内水面の養殖を同じ対象年で確認します。",
      "metricGroupKeys": [
        "aquaculture"
      ],
      "chartKeys": [
        "theme-fishery-aquaculture-mix"
      ]
    },
    {
      "key": "output-workers",
      "title": "産出額と担い手",
      "description": "海面漁業と養殖を含む産出額、海面漁業だけの産出額は対象が違います。金額・漁獲量・就業者数を分けて読みます。",
      "metricGroupKeys": [
        "output-workers-1",
        "output-workers-2"
      ],
      "chartKeys": [
        "theme-fishery-output-trend",
        "theme-fishery-output-trend-marine",
        "theme-fishery-half-century"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "catch",
      "title": "漁獲と養殖の供給",
      "rankingKeys": [
        "fish-catch",
        "aquaculture-harvest",
        "marine-fishery-catch"
      ],
      "defaultCheckedKeys": [
        "fish-catch",
        "aquaculture-harvest"
      ]
    },
    {
      "key": "aquaculture",
      "title": "養殖の海面・内水面構造",
      "rankingKeys": [
        "marine-aquaculture-harvest",
        "inland-aquaculture-harvest"
      ],
      "defaultCheckedKeys": [
        "marine-aquaculture-harvest",
        "inland-aquaculture-harvest"
      ]
    },
    {
      "key": "output-workers-1",
      "title": "産出額（新）",
      "rankingKeys": [
        "marine-fishery-aquaculture-output-value"
      ],
      "defaultCheckedKeys": [
        "marine-fishery-aquaculture-output-value"
      ]
    },
    {
      "key": "output-workers-2",
      "title": "漁業就業者",
      "rankingKeys": [
        "fishery-workers"
      ],
      "defaultCheckedKeys": [
        "fishery-workers"
      ]
    }
  ]
};
