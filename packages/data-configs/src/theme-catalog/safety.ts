import type { ThemeCatalog } from "./types";

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
      "role": "context"
    },
    {
      "rankingKey": "violent-crime-per-100k",
      "shortLabel": "粗暴犯",
      "role": "context"
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
      "role": "context"
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
      "role": "context"
    },
    {
      "rankingKey": "building-fire-count-per-100-thousand-people",
      "shortLabel": "火災",
      "role": "secondary"
    },
    {
      "rankingKey": "fire-deaths-per-100k",
      "shortLabel": "火災死者",
      "role": "context"
    },
    {
      "rankingKey": "fire-damage-casualties-per-population",
      "shortLabel": "火災被害",
      "role": "context"
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動",
      "role": "context"
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
    },
    {
      "rankingKey": "traffic-accident-injuries",
      "shortLabel": "交通事故負傷者数",
      "role": "context"
    },
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
          "count"
        ],
        "lineColors": [
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "penal-code-offenses-recognized-per-1000",
        "criminal-arrest-rate"
      ],
      "sourceName": "犯罪統計",
      "sourceLink": null,
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
          "count",
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "traffic-accident-count",
        "traffic-accident-injuries"
      ],
      "sourceName": "交通事故統計",
      "sourceLink": null,
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
          "count",
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "building-fire-count-per-100-thousand-people",
        "annual-emergency-dispatches-per-1000"
      ],
      "sourceName": "消防統計",
      "sourceLink": null,
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
          "special",
          "neutral"
        ]
      },
      "relatedRankingKeys": [
        "suicides-per-100k",
        "accidental-deaths-per-100k"
      ],
      "sourceName": "人口動態統計",
      "sourceLink": null,
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
            "color": "population"
          },
          {
            "code": "K420102",
            "label": "粗暴犯",
            "color": "count"
          },
          {
            "code": "K420104",
            "label": "知能犯",
            "color": "special"
          },
          {
            "code": "K420105",
            "label": "風俗犯",
            "color": "series-6"
          },
          {
            "code": "K420101",
            "label": "凶悪犯",
            "color": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "criminal-recognition-count"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系（警察庁 犯罪統計）",
      "sourceLink": null,
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
            "color": "count"
          },
          {
            "code": "K2110",
            "label": "火災死亡者",
            "color": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "fire-deaths-per-100k"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系（消防庁 火災年報）",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20
    }
  ],
  evidenceTopics: [
    {
      key: "recognized-crime-and-clearance",
      lensKey: "outcomes",
      title: "犯罪の認知状況と検挙状況",
      question:
        "刑法犯の認知件数と検挙率には、地域ごとにどのような差があるか",
      summary:
        "認知件数は警察が犯罪の発生を認知した事件数で、未認知の事件は含みません。検挙率は検挙した事件件数を認知件数で割った割合であり、検挙人員の割合ではありません。",
      sourceKeys: ["npa-crime-statistics"],
      relatedRankingKeys: [
        "penal-code-offenses-recognized-per-1000",
        "criminal-arrest-rate",
      ],
      relatedChartKeys: ["crime-count-arrest-rate-trend"],
    },
    {
      key: "traffic-accidents-and-injuries",
      lensKey: "outcomes",
      title: "交通事故の発生と人的被害",
      question:
        "交通事故の発生件数と負傷者数には、地域ごとにどのような差があるか",
      summary:
        "現在の交通事故統計は、人の死亡または負傷を伴う事故を対象とし、物損事故は含みません。発生件数は事故の数、負傷者数は重傷者と軽傷者の人数なので、同じ単位として足し合わせません。",
      sourceKeys: ["npa-traffic-accident-statistics"],
      relatedRankingKeys: [
        "traffic-accident-count",
        "traffic-accident-injuries",
      ],
      relatedChartKeys: ["traffic-accident-deaths-trend"],
    },
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
