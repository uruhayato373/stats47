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
      "role": "secondary"
    },
    {
      "rankingKey": "inland-fishery-catch",
      "shortLabel": "内水面漁獲量",
      "role": "secondary"
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
      "role": "secondary"
    },
    {
      "rankingKey": "inland-aquaculture-harvest",
      "shortLabel": "内水面養殖",
      "role": "secondary"
    },
    {
      "rankingKey": "marine-fishery-aquaculture-output-value",
      "shortLabel": "産出額（新）",
      "role": "primary"
    },
    {
      "rankingKey": "marine-fishery-output-value",
      "shortLabel": "海面漁業産出額",
      "role": "secondary"
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
      "role": "secondary"
    },
    {
      "rankingKey": "fishery-species-catch-japanese-squid",
      "shortLabel": "スルメイカ",
      "role": "secondary"
    },
    {
      "rankingKey": "fishery-species-catch-tuna",
      "shortLabel": "マグロ類",
      "role": "secondary"
    },
    {
      "rankingKey": "fishery-species-catch-bonito",
      "shortLabel": "カツオ",
      "role": "secondary"
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
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3121"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C312101"
          }
        ],
        "labels": [
          "漁獲量（合計）",
          "海面漁獲量"
        ],
        "seriesColors": [
          "#3b82f6",
          "#06b6d4"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
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
        "columnParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C312201"
          }
        ],
        "lineParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C312202"
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
          "#06b6d4"
        ],
        "lineColors": [
          "#22c55e"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
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
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C31201"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C312001"
          }
        ],
        "labels": [
          "海面漁業・養殖業産出額（新）",
          "海面漁業産出額（長期）"
        ],
        "seriesColors": [
          "#f59e0b",
          "#6b7280"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
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
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3121"
          },
          {
            "statsDataId": "0000010103",
            "cdCat01": "C3125"
          }
        ],
        "labels": [
          "漁獲量",
          "漁業就業者数"
        ],
        "seriesColors": [
          "#3b82f6",
          "#8b5cf6"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
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
        "statsDataId": "0003238633",
        "topN": 9,
        "categories": [
          {
            "code": "0980",
            "label": "ホタテガイ",
            "color": "#3b82f6"
          },
          {
            "code": "1040",
            "label": "スルメイカ",
            "color": "#06b6d4"
          },
          {
            "code": "0120",
            "label": "マグロ類",
            "color": "#8b5cf6"
          },
          {
            "code": "0250",
            "label": "カツオ",
            "color": "#f59e0b"
          },
          {
            "code": "0410",
            "label": "サバ類",
            "color": "#ef4444"
          },
          {
            "code": "0420",
            "label": "サンマ",
            "color": "#22c55e"
          },
          {
            "code": "0430",
            "label": "ブリ類",
            "color": "#eab308"
          },
          {
            "code": "0330",
            "label": "イワシ類",
            "color": "#14b8a6"
          },
          {
            "code": "0490",
            "label": "スケトウダラ",
            "color": "#a855f7"
          },
          {
            "code": "1130",
            "label": "コンブ類",
            "color": "#84cc16"
          },
          {
            "code": "0880",
            "label": "ズワイガニ",
            "color": "#f97316"
          },
          {
            "code": "0660",
            "label": "タイ類",
            "color": "#ec4899"
          }
        ]
      },
      "sourceName": "海面漁業生産統計調査",
      "sourceLink": null,
      "rankingLink": null,
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
        "estatParams": [
          {
            "statsDataId": "0003238633",
            "cdCat01": "0330"
          },
          {
            "statsDataId": "0003238633",
            "cdCat01": "0420"
          },
          {
            "statsDataId": "0003238633",
            "cdCat01": "0980"
          },
          {
            "statsDataId": "0003238633",
            "cdCat01": "1040"
          }
        ],
        "labels": [
          "イワシ類",
          "サンマ",
          "ホタテガイ",
          "スルメイカ"
        ],
        "seriesColors": [
          "#14b8a6",
          "#22c55e",
          "#3b82f6",
          "#06b6d4"
        ]
      },
      "sourceName": "海面漁業生産統計調査",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 6,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "魚種別",
      "sortOrder": 1
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
