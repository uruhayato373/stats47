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
      "rankingKey": "fishing-port-count",
      "shortLabel": "漁港数",
      "role": "context"
    },
    {
      "rankingKey": "fishing-port-count-ksj",
      "shortLabel": "漁港数(KSJ)",
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
            "label": "ホタテガイ",
            "colorRole": "population"
          },
          {
            "metricKey": "fishery-species-catch-japanese-squid",
            "label": "スルメイカ",
            "colorRole": "series-6"
          },
          {
            "metricKey": "fishery-species-catch-tuna",
            "label": "マグロ類",
            "colorRole": "special"
          },
          {
            "metricKey": "fishery-species-catch-bonito",
            "label": "カツオ",
            "colorRole": "count"
          },
          {
            "metricKey": "fishery-species-catch-mackerel",
            "label": "サバ類",
            "colorRole": "danger"
          },
          {
            "metricKey": "fishery-species-catch-pacific-saury",
            "label": "サンマ",
            "colorRole": "improve"
          },
          {
            "metricKey": "fishery-species-catch-yellowtail",
            "label": "ブリ類",
            "colorRole": "series-11"
          },
          {
            "metricKey": "fishery-species-catch-sardine",
            "label": "イワシ類",
            "colorRole": "series-8"
          },
          {
            "metricKey": "fishery-species-catch-pollock",
            "label": "スケトウダラ",
            "colorRole": "series-10"
          },
          {
            "metricKey": "fishery-species-catch-kelp",
            "label": "コンブ類",
            "colorRole": "series-9"
          },
          {
            "metricKey": "fishery-species-catch-snow-crab",
            "label": "ズワイガニ",
            "colorRole": "series-12"
          },
          {
            "metricKey": "fishery-species-catch-sea-bream",
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
            "metricKey": "fishery-species-catch-sardine"
          },
          {
            "metricKey": "fishery-species-catch-pacific-saury"
          },
          {
            "metricKey": "fishery-species-catch-scallop"
          },
          {
            "metricKey": "fishery-species-catch-japanese-squid"
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
  ]
};
