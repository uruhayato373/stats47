import type { ThemeCatalog } from "./types";

export const SAFETY_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "犯罪・交通・火災の発生と対応を比較。",
    "headlineRankingKeys": [
      "penal-code-offenses-recognized-per-1000",
      "traffic-accident-deaths-per-100k",
      "building-fire-count-per-100-thousand-people",
      "criminal-arrest-rate"
    ],
    "comparisonRankingKeys": [
      "penal-code-offenses-recognized-per-1000",
      "traffic-accident-deaths-per-100k",
      "building-fire-count-per-100-thousand-people",
      "criminal-arrest-rate",
      "traffic-accident-injuries-per-100k",
      "annual-emergency-dispatches-per-1000"
    ],
    "mapNotes": {
      "penal-code-offenses-recognized-per-1000": "人口千人当たりの刑法犯認知件数。警察が把握していない事件は含みません。",
      "traffic-accident-deaths-per-100k": "人口10万人当たりの交通事故死者。警察統計の24時間死者が対象。",
      "building-fire-count-per-100-thousand-people": "人口10万人当たりの全出火件数。建物火災だけの件数ではありません。",
      "criminal-arrest-rate": "認知件数に対する検挙件数。検挙人数の割合ではありません。",
      "traffic-accident-injuries-per-100k": "人口10万人当たりの負傷者。事故件数とは単位が異なります。",
      "annual-emergency-dispatches-per-1000": "人口千人当たりの救急出動。急病や転院搬送なども含みます。"
    }
  },
  "key": "safety",
  "title": "安全",
  "description": "都道府県別の犯罪率・検挙率・交通事故・火災件数・自殺率をランキングとチャートで比較。治安・交通・火災・災害・事故の25指標を47都道府県で確認できます。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "penal-code-offenses-recognized-per-1000",
      "shortLabel": "刑法犯認知（千人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "警察庁 犯罪統計",
        "sourceUrl": "https://www.npa.go.jp/publications/statistics/sousa/statistics.html",
        "surveyedAt": "2026-09-09",
        "rationale": "認知された犯罪の地域差を人口規模で標準化する。短い見出しも「刑法犯認知」とし犯罪全体の発生確率とはしない。"
      }
    },
    {
      "rankingKey": "serious-crime-per-100k",
      "shortLabel": "凶悪犯",
      "role": "context"
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
      "shortLabel": "刑法犯検挙率",
      "role": "primary",
      "selection": {
        "proposedBy": "警察庁 犯罪統計",
        "sourceUrl": "https://www.npa.go.jp/publications/statistics/sousa/statistics.html",
        "surveyedAt": "2026-09-09",
        "rationale": "認知状況と対応状況を区別するための主要指標。犯罪率の裏返しとして扱わない。"
      }
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
      "shortLabel": "交通事故死者（10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "警察庁 交通事故発生状況・交通安全白書",
        "sourceUrl": "https://www.npa.go.jp/publications/statistics/koutsuu/index_jiko.html",
        "surveyedAt": "2026-09-09",
        "rationale": "件数だけでは伝わらない人的被害の大きさを主要カードと地図で示す。"
      }
    },
    {
      "rankingKey": "traffic-accident-count-per-population",
      "shortLabel": "交通事故率",
      "role": "context"
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
      "shortLabel": "交通事故負傷者（10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "警察庁 交通事故発生状況",
        "sourceUrl": "https://www.npa.go.jp/publications/statistics/koutsuu/index_jiko.html",
        "surveyedAt": "2026-09-09",
        "rationale": "死者と負傷者を区別して人的被害を比較表で補う。"
      }
    },
    {
      "rankingKey": "traffic-accident-casualties-elderly-65plus",
      "shortLabel": "高齢者事故",
      "role": "context"
    },
    {
      "rankingKey": "building-fire-count-per-100-thousand-people",
      "shortLabel": "出火件数（10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "令和7年版消防白書・社会人口統計体系",
        "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/",
        "surveyedAt": "2026-09-09",
        "rationale": "犯罪・交通に加える身近な災害の主指標。既存キー名はbuildingだがSSDS定義は全出火なので表示は火災出火件数とする。"
      }
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
      "shortLabel": "救急出動（千人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版消防白書",
        "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/",
        "surveyedAt": "2026-09-09",
        "rationale": "火災の発生と消防・救急の活動量を分けて表で比較する。"
      }
    },
    {
      "rankingKey": "disaster-damage-amount-per-person",
      "shortLabel": "災害被害額",
      "role": "context"
    },
    {
      "rankingKey": "suicide-rate-per-100k",
      "shortLabel": "自殺率",
      "role": "context"
    },
    {
      "rankingKey": "suicides-per-100k",
      "shortLabel": "自殺者数",
      "role": "context"
    },
    {
      "rankingKey": "accidental-deaths-per-100k",
      "shortLabel": "事故死",
      "role": "context"
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
    }
  ],
  "charts": [
    {
      "componentKey": "crime-count-arrest-rate-trend",
      "componentType": "mixed-chart",
      "title": "刑法犯認知と検挙率",
      "componentProps": {
        "columnSeriesRefs": [
          {
            "metricKey": "penal-code-offenses-recognized-per-1000",
            "label": "刑法犯認知（千人当たり）"
          }
        ],
        "lineSeriesRefs": [
          {
            "metricKey": "criminal-arrest-rate",
            "label": "刑法犯検挙率"
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
      "sortOrder": 0,
      "annotation": "認知件数は人口千人当たり、検挙率は％。分母の異なる指標を別軸で表示します。"
    },
    {
      "componentKey": "traffic-accident-deaths-trend",
      "componentType": "line-chart",
      "title": "交通事故件数と負傷者数",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "traffic-accident-count"
          },
          {
            "metricKey": "traffic-accident-injuries"
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
      "sortOrder": 10,
      "annotation": "人身事故が対象。件数と人数は別軸で表示し、合計しません。"
    }
  ],
  evidenceTopics: [
    {
      "key": "recognized-crime-and-clearance",
      "lensKey": "outcomes",
      "title": "犯罪の認知状況と検挙状況",
      "question": "刑法犯の認知件数と検挙率には、地域ごとにどのような差があるか",
      "summary": "認知件数は警察が犯罪の発生を認知した事件数で、未認知の事件は含みません。検挙率は検挙した事件件数を認知件数で割った割合であり、検挙人員の割合ではありません。",
      "sourceKeys": [
        "npa-crime-statistics"
      ],
      "relatedRankingKeys": [
        "penal-code-offenses-recognized-per-1000",
        "criminal-arrest-rate"
      ],
      "relatedChartKeys": [
        "crime-count-arrest-rate-trend"
      ]
    },
    {
      "key": "traffic-accidents-and-injuries",
      "lensKey": "outcomes",
      "title": "交通事故の発生と人的被害",
      "question": "交通事故の発生件数と負傷者数には、地域ごとにどのような差があるか",
      "summary": "現在の交通事故統計は、人の死亡または負傷を伴う事故を対象とし、物損事故は含みません。発生件数は事故の数、負傷者数は重傷者と軽傷者の人数なので、同じ単位として足し合わせません。",
      "sourceKeys": [
        "npa-traffic-accident-statistics"
      ],
      "relatedRankingKeys": [
        "traffic-accident-count",
        "traffic-accident-injuries"
      ],
      "relatedChartKeys": [
        "traffic-accident-deaths-trend"
      ]
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
