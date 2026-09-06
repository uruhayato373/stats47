import type { ThemeCatalog } from "./types";

export const FISHERY_MARINE_CATALOG: ThemeCatalog = {
  "key": "fishery-marine",
  "title": "漁業（水産業）",
  "description": "都道府県別の漁獲量・養殖収獲量・漁業就業者数・漁業産出額・漁港数をランキングとチャートで比較。北海道が全国漁獲量の約2割を占める一方、半世紀で就業者は7割減・漁獲量はほぼ半減。「捕る漁業」から「育てる漁業」へのシフトを47都道府県のデータで確認できます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fish-catch",
      "shortLabel": "漁獲量",
      "role": "primary"
    },
    {
      "rankingKey": "marine-fishery-catch",
      "shortLabel": "海面漁獲量",
      "role": "context"
    },
    {
      "rankingKey": "inland-fishery-catch",
      "shortLabel": "内水面漁獲量",
      "role": "context"
    },
    {
      "rankingKey": "fishing-port-count-ksj",
      "shortLabel": "指定漁港総数",
      "role": "context"
    },
    {
      "rankingKey": "aquaculture-harvest",
      "shortLabel": "養殖収獲量",
      "role": "secondary"
    },
    {
      "rankingKey": "marine-aquaculture-harvest",
      "shortLabel": "海面養殖",
      "role": "context"
    },
    {
      "rankingKey": "inland-aquaculture-harvest",
      "shortLabel": "内水面養殖",
      "role": "context"
    },
    {
      "rankingKey": "marine-fishery-aquaculture-output-value",
      "shortLabel": "産出額（新）",
      "role": "primary"
    },
    {
      "rankingKey": "marine-fishery-output-value",
      "shortLabel": "海面漁業産出額",
      "role": "context"
    },
    {
      "rankingKey": "fishery-output-value",
      "shortLabel": "産出額（旧）",
      "role": "context"
    },
    {
      "rankingKey": "fishery-workers",
      "shortLabel": "漁業就業者",
      "role": "primary"
    },
    {
      "rankingKey": "fishery-species-catch-scallop",
      "shortLabel": "ホタテガイ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-japanese-squid",
      "shortLabel": "スルメイカ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-tuna",
      "shortLabel": "マグロ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-bonito",
      "shortLabel": "カツオ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-mackerel",
      "shortLabel": "サバ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-pacific-saury",
      "shortLabel": "サンマ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-yellowtail",
      "shortLabel": "ブリ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-sardine",
      "shortLabel": "イワシ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-pollock",
      "shortLabel": "スケトウダラ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-kelp",
      "shortLabel": "コンブ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-snow-crab",
      "shortLabel": "ズワイガニ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-sea-bream",
      "shortLabel": "タイ類",
      "role": "context"
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
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "漁獲",
      "sortOrder": 0
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
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "養殖",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-fishery-output-trend",
      "componentType": "line-chart",
      "title": "漁業産出額の推移（新シリーズと長期）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "marine-fishery-aquaculture-output-value"
          },
          {
            "metricKey": "marine-fishery-output-value"
          }
        ],
        "labels": [
          "海面漁業・養殖業産出額（新）",
          "海面漁業産出額（長期）"
        ],
        "seriesColors": [
          "count",
          "neutral"
        ]
      },
      "relatedRankingKeys": [
        "marine-fishery-aquaculture-output-value",
        "marine-fishery-output-value"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "経済",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-fishery-half-century",
      "componentType": "line-chart",
      "title": "漁獲量と漁業就業者数の半世紀（1975-2023）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fish-catch"
          },
          {
            "metricKey": "fishery-workers"
          }
        ],
        "labels": [
          "漁獲量",
          "漁業就業者数"
        ],
        "seriesColors": [
          "population",
          "special"
        ]
      },
      "relatedRankingKeys": [
        "fish-catch",
        "fishery-workers"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "推移",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-fishery-species-share",
      "componentType": "donut-chart",
      "title": "魚種別漁獲量構成比（2015年・全国）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fishery-species-catch-scallop",
            "area": "national",
            "label": "ホタテガイ",
            "colorRole": "population"
          },
          {
            "metricKey": "fishery-species-catch-japanese-squid",
            "area": "national",
            "label": "スルメイカ",
            "colorRole": "series-6"
          },
          {
            "metricKey": "fishery-species-catch-tuna",
            "area": "national",
            "label": "マグロ類",
            "colorRole": "special"
          },
          {
            "metricKey": "fishery-species-catch-bonito",
            "area": "national",
            "label": "カツオ",
            "colorRole": "count"
          },
          {
            "metricKey": "fishery-species-catch-mackerel",
            "area": "national",
            "label": "サバ類",
            "colorRole": "danger"
          },
          {
            "metricKey": "fishery-species-catch-pacific-saury",
            "area": "national",
            "label": "サンマ",
            "colorRole": "improve"
          },
          {
            "metricKey": "fishery-species-catch-yellowtail",
            "area": "national",
            "label": "ブリ類",
            "colorRole": "series-11"
          },
          {
            "metricKey": "fishery-species-catch-sardine",
            "area": "national",
            "label": "イワシ類",
            "colorRole": "series-8"
          },
          {
            "metricKey": "fishery-species-catch-pollock",
            "area": "national",
            "label": "スケトウダラ",
            "colorRole": "series-10"
          },
          {
            "metricKey": "fishery-species-catch-kelp",
            "area": "national",
            "label": "コンブ類",
            "colorRole": "series-9"
          },
          {
            "metricKey": "fishery-species-catch-snow-crab",
            "area": "national",
            "label": "ズワイガニ",
            "colorRole": "series-12"
          },
          {
            "metricKey": "fishery-species-catch-sea-bream",
            "area": "national",
            "label": "タイ類",
            "colorRole": "female"
          }
        ],
        "topN": 9
      },
      "relatedRankingKeys": [
        "fishery-species-catch-scallop",
        "fishery-species-catch-japanese-squid",
        "fishery-species-catch-tuna",
        "fishery-species-catch-bonito",
        "fishery-species-catch-mackerel",
        "fishery-species-catch-pacific-saury",
        "fishery-species-catch-yellowtail",
        "fishery-species-catch-sardine",
        "fishery-species-catch-pollock",
        "fishery-species-catch-kelp",
        "fishery-species-catch-snow-crab",
        "fishery-species-catch-sea-bream"
      ],
      "sourceName": "海面漁業生産統計調査",
      "sourceLink": null,
      "gridColumnSpan": 6,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "魚種別",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-fishery-species-trend",
      "componentType": "line-chart",
      "title": "主要魚種の長期推移（1956-2015年・全国）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "fishery-species-catch-sardine",
            "area": "national"
          },
          {
            "metricKey": "fishery-species-catch-pacific-saury",
            "area": "national"
          },
          {
            "metricKey": "fishery-species-catch-scallop",
            "area": "national"
          },
          {
            "metricKey": "fishery-species-catch-japanese-squid",
            "area": "national"
          }
        ],
        "labels": [
          "イワシ類",
          "サンマ",
          "ホタテガイ",
          "スルメイカ"
        ],
        "seriesColors": [
          "series-8",
          "improve",
          "population",
          "series-6"
        ]
      },
      "relatedRankingKeys": [
        "fishery-species-catch-sardine",
        "fishery-species-catch-pacific-saury",
        "fishery-species-catch-scallop",
        "fishery-species-catch-japanese-squid"
      ],
      "sourceName": "海面漁業生産統計調査",
      "sourceLink": null,
      "gridColumnSpan": 6,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "魚種別",
      "sortOrder": 1
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
      key: "fish-consumption-east-west",
      lensKey: "composition",
      title: "生鮮魚介の好みは産地ではなく消費地で分かれる",
      question:
        "家庭で買う生鮮魚介の支出額を品目別に並べると、県庁所在市はどのような地域のまとまりに分かれるか",
      summary:
        "漁獲量が多い産地と、家庭でよく買う消費地は一致しない。太平洋側・東日本はまぐろ・さけ・さんま、日本海側・西日本はぶり・さば・かれい・たい・あじの支出が相対的に大きい。値は県庁所在市の二人以上世帯で、外食は含まない。",
      sourceKeys: ["stat-family-income-expenditure-survey-2024"],
      relatedRankingKeys: [
        "tuna-consumption-expenditure",
        "yellowtail-consumption-expenditure",
        "saury-consumption-expenditure",
        "bonito-consumption-expenditure",
        "oyster-consumption-expenditure",
        "mackerel-consumption-expenditure",
        "fishery-species-catch-tuna",
        "fishery-species-catch-yellowtail",
      ],
      relatedChartKeys: ["theme-fishery-species-share"],
      relatedThemeKeys: ["tourism", "local-economy"],
    },
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
  ]
};
