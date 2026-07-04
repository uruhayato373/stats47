import type { ThemeCatalog } from "./types";

// Migrated 2026-07-04 from IndicatorSet + page-components JSON (byte-exact round-trip verified).
export const SAFETY_CATALOG: ThemeCatalog = {
  "key": "safety",
  "title": "安全",
  "description": "都道府県別の犯罪率・検挙率・交通事故・火災件数・自殺率をランキングとチャートで比較。治安・交通・火災・災害・事故の25指標を47都道府県で確認できます。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "penal-code-offenses-recognized-per-1000",
      "shortLabel": "犯罪率",
      "role": "primary"
    },
    {
      "rankingKey": "serious-crime-per-100k",
      "shortLabel": "凶悪犯",
      "role": "primary"
    },
    {
      "rankingKey": "criminal-recognition-count",
      "shortLabel": "認知件数",
      "role": "secondary"
    },
    {
      "rankingKey": "violent-crime-per-100k",
      "shortLabel": "粗暴犯",
      "role": "secondary"
    },
    {
      "rankingKey": "criminal-arrest-rate",
      "shortLabel": "検挙率",
      "role": "secondary"
    },
    {
      "rankingKey": "intellectual-crime-per-100k",
      "shortLabel": "知能犯",
      "role": "context"
    },
    {
      "rankingKey": "theft-offenses-recognized-per-1000",
      "shortLabel": "窃盗率",
      "role": "context"
    },
    {
      "rankingKey": "theft-criminal-arrest-rate",
      "shortLabel": "窃盗検挙率",
      "role": "context"
    },
    {
      "rankingKey": "juvenile-criminal-arrest-person-per-population",
      "shortLabel": "少年犯罪率",
      "role": "secondary"
    },
    {
      "rankingKey": "drug-enforcement-arrest-count-per-population",
      "shortLabel": "薬物検挙",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100k",
      "shortLabel": "交通死者",
      "role": "primary"
    },
    {
      "rankingKey": "traffic-accident-count-per-population",
      "shortLabel": "交通事故率",
      "role": "secondary"
    },
    {
      "rankingKey": "traffic-accident-count",
      "shortLabel": "事故件数",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100-accidents",
      "shortLabel": "致死率",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-injuries-per-100k",
      "shortLabel": "負傷者率",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-casualties-elderly-65plus",
      "shortLabel": "高齢者事故",
      "role": "secondary"
    },
    {
      "rankingKey": "building-fire-count-per-100-thousand-people",
      "shortLabel": "火災",
      "role": "secondary"
    },
    {
      "rankingKey": "fire-deaths-per-100k",
      "shortLabel": "火災死者",
      "role": "secondary"
    },
    {
      "rankingKey": "fire-damage-casualties-per-population",
      "shortLabel": "火災被害",
      "role": "context"
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動",
      "role": "secondary"
    },
    {
      "rankingKey": "disaster-damage-amount-per-person",
      "shortLabel": "災害被害額",
      "role": "context"
    },
    {
      "rankingKey": "suicide-rate-per-100k",
      "shortLabel": "自殺率",
      "role": "secondary"
    },
    {
      "rankingKey": "suicides-per-100k",
      "shortLabel": "自殺者数",
      "role": "context"
    },
    {
      "rankingKey": "accidental-deaths-per-100k",
      "shortLabel": "事故死",
      "role": "secondary"
    },
    {
      "rankingKey": "police-officer-count-per-population",
      "shortLabel": "警察官数",
      "role": "context"
    }
  ],
  "panelTabs": [
    {
      "label": "治安",
      "rankingKeys": [
        "penal-code-offenses-recognized-per-1000",
        "serious-crime-per-100k",
        "violent-crime-per-100k",
        "juvenile-criminal-arrest-person-per-population",
        "theft-offenses-recognized-per-1000",
        "drug-enforcement-arrest-count-per-population",
        "police-officer-count-per-population"
      ]
    },
    {
      "label": "交通",
      "rankingKeys": [
        "traffic-accident-deaths-per-100k",
        "traffic-accident-count-per-population",
        "traffic-accident-count",
        "traffic-accident-deaths-per-100-accidents",
        "traffic-accident-injuries-per-100k",
        "traffic-accident-casualties-elderly-65plus"
      ]
    },
    {
      "label": "火災・救急",
      "rankingKeys": [
        "building-fire-count-per-100-thousand-people",
        "fire-deaths-per-100k",
        "fire-damage-casualties-per-population",
        "annual-emergency-dispatches-per-1000"
      ]
    },
    {
      "label": "災害",
      "rankingKeys": [
        "disaster-damage-amount-per-person"
      ]
    },
    {
      "label": "自殺・事故",
      "rankingKeys": [
        "suicide-rate-per-100k",
        "suicides-per-100k",
        "accidental-deaths-per-100k"
      ]
    }
  ],
  "charts": [
    {
      "componentKey": "crime-count-arrest-rate-trend",
      "componentType": "mixed-chart",
      "title": "刑法犯認知件数と検挙率の推移",
      "componentProps": {
        "columnParams": [
          {
            "statsDataId": "0000010211",
            "cdCat01": "#K06101"
          }
        ],
        "lineParams": [
          {
            "statsDataId": "0000010211",
            "cdCat01": "#K06201"
          }
        ],
        "columnLabels": [
          "認知件数"
        ],
        "lineLabels": [
          "検挙率"
        ],
        "leftUnit": "件/千人",
        "rightUnit": "%",
        "columnColors": [
          "#f59e0b"
        ],
        "lineColors": [
          "#22c55e"
        ]
      },
      "sourceName": "犯罪統計",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "治安",
      "sortOrder": 0
    },
    {
      "componentKey": "traffic-accident-deaths-trend",
      "componentType": "line-chart",
      "title": "交通事故 発生件数と負傷者数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010111",
            "cdCat01": "K3101"
          },
          {
            "statsDataId": "0000010111",
            "cdCat01": "K3104"
          }
        ],
        "labels": [
          "事故発生件数",
          "負傷者数"
        ],
        "seriesColors": [
          "#f59e0b",
          "#ef4444"
        ]
      },
      "sourceName": "交通事故統計",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "交通",
      "sortOrder": 0
    },
    {
      "componentKey": "fire-emergency-trend",
      "componentType": "line-chart",
      "title": "火災出火件数と救急出動件数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010211",
            "cdCat01": "#K02101"
          },
          {
            "statsDataId": "0000010209",
            "cdCat01": "#I11201"
          }
        ],
        "labels": [
          "出火件数(10万人当たり)",
          "救急出動(千人当たり)"
        ],
        "seriesColors": [
          "#f59e0b",
          "#22c55e"
        ]
      },
      "sourceName": "消防統計",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "火災・救急",
      "sortOrder": 0
    },
    {
      "componentKey": "suicide-accident-death-trend",
      "componentType": "line-chart",
      "title": "自殺率と不慮の事故死亡率の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010209",
            "cdCat01": "#I06201"
          },
          {
            "statsDataId": "0000010211",
            "cdCat01": "#K08101"
          }
        ],
        "labels": [
          "自殺率",
          "不慮の事故死亡率"
        ],
        "seriesColors": [
          "#8b5cf6",
          "#6b7280"
        ]
      },
      "sourceName": "人口動態統計",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "自殺・事故",
      "sortOrder": 0
    },
    {
      "componentKey": "safety-crime-types-donut",
      "componentType": "donut-chart",
      "title": "罪種別 刑法犯認知件数の内訳（2023年）",
      "componentProps": {
        "statsDataId": "0000010111",
        "topN": 5,
        "categories": [
          {
            "code": "K420103",
            "label": "窃盗犯",
            "color": "#3b82f6"
          },
          {
            "code": "K420102",
            "label": "粗暴犯",
            "color": "#f59e0b"
          },
          {
            "code": "K420104",
            "label": "知能犯",
            "color": "#8b5cf6"
          },
          {
            "code": "K420105",
            "label": "風俗犯",
            "color": "#06b6d4"
          },
          {
            "code": "K420101",
            "label": "凶悪犯",
            "color": "#ef4444"
          }
        ]
      },
      "sourceName": "総務省統計局 社会・人口統計体系（警察庁 犯罪統計）",
      "sourceLink": null,
      "rankingLink": "/ranking/criminal-recognition-count",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
    {
      "componentKey": "safety-fire-casualties-donut",
      "componentType": "donut-chart",
      "title": "火災による死傷者の内訳（2023年）",
      "componentProps": {
        "statsDataId": "0000010111",
        "topN": 2,
        "categories": [
          {
            "code": "K2111",
            "label": "火災負傷者",
            "color": "#f59e0b"
          },
          {
            "code": "K2110",
            "label": "火災死亡者",
            "color": "#ef4444"
          }
        ]
      },
      "sourceName": "総務省統計局 社会・人口統計体系（消防庁 火災年報）",
      "sourceLink": null,
      "rankingLink": "/ranking/fire-deaths-per-100k",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20
    }
  ],
  "keywords": [
    "犯罪",
    "刑法犯",
    "凶悪犯",
    "治安",
    "交通事故",
    "死者数",
    "火災",
    "救急",
    "災害",
    "自殺",
    "都道府県",
    "ランキング"
  ]
};
