import type { ThemeCatalog } from "./types";

export const SAFETY_CATALOG: ThemeCatalog = {
  "key": "safety",
  "title": "安全",
  "description": "犯罪、交通事故、火災の発生と被害を別の軸として確認する。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "penal-code-offenses-recognized-per-1000",
      "shortLabel": "刑法犯認知件数（人口千人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口千人当たりの刑法犯認知件数を用いて、人口規模を揃えた地域差を確認する。地域内の総数とは区別する。"
      }
    },
    {
      "rankingKey": "serious-crime-per-100k",
      "shortLabel": "凶悪犯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "凶悪犯は「犯罪の認知と検挙」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "criminal-recognition-count",
      "shortLabel": "認知件数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "認知件数は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "violent-crime-per-100k",
      "shortLabel": "粗暴犯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "粗暴犯は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "criminal-arrest-rate",
      "shortLabel": "検挙率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "検挙率は「犯罪の認知と検挙」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "intellectual-crime-per-100k",
      "shortLabel": "知能犯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "知能犯は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "theft-offenses-recognized-per-1000",
      "shortLabel": "窃盗犯認知件数（人口千人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口千人当たりの窃盗犯認知件数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "theft-criminal-arrest-rate",
      "shortLabel": "窃盗検挙率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "窃盗検挙率は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "juvenile-criminal-arrest-person-per-population",
      "shortLabel": "少年刑法犯検挙人員（14～19歳人口千人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "14～19歳人口千人当たりの少年刑法犯検挙人員として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "drug-enforcement-arrest-count-per-population",
      "shortLabel": "覚醒剤取締検挙件数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの覚醒剤取締検挙件数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100k",
      "shortLabel": "交通事故死者数（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの交通事故死者数を用いて、人口規模を揃えた地域差を確認する。地域内の総数とは区別する。"
      }
    },
    {
      "rankingKey": "traffic-accident-count-per-population",
      "shortLabel": "交通事故発生件数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの交通事故発生件数を用いて、人口規模を揃えた地域差を確認する。地域内の総数とは区別する。"
      }
    },
    {
      "rankingKey": "traffic-accident-count",
      "shortLabel": "事故件数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "事故件数は「交通事故の発生と人的被害」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100-accidents",
      "shortLabel": "交通事故死者数（交通事故100件当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "交通事故100件当たりの交通事故死者数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "traffic-accident-injuries-per-100k",
      "shortLabel": "交通事故負傷者数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの交通事故負傷者数を用いて、人口規模を揃えた地域差を確認する。地域内の総数とは区別する。"
      }
    },
    {
      "rankingKey": "traffic-accident-casualties-elderly-65plus",
      "shortLabel": "高齢者事故",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢者事故は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "building-fire-count-per-100-thousand-people",
      "shortLabel": "火災出火件数（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの火災出火件数を用いて、人口規模を揃えた地域差を確認する。地域内の総数とは区別する。"
      }
    },
    {
      "rankingKey": "fire-deaths-per-100k",
      "shortLabel": "火災死者",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "火災死者は「火災と救急需要」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "fire-damage-casualties-per-population",
      "shortLabel": "火災死傷者数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの火災死傷者数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動件数（人口千人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口千人当たりの救急出動件数を用いて、人口規模を揃えた地域差を確認する。地域内の総数とは区別する。"
      }
    },
    {
      "rankingKey": "disaster-damage-amount-per-person",
      "shortLabel": "災害被害額（人口1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口1人当たりの災害被害額として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "suicide-rate-per-100k",
      "shortLabel": "自殺率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "自殺死亡を治安評価に含めず、健康アウトカムとして対象定義を明示する。 主表示は「医療・健康」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "suicides-per-100k",
      "shortLabel": "自殺者数（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人当たりの自殺者数として定義を示し、補足指標への導線を保持する。 自殺率の別系列と定義・出典を照合し、並列KPI化しない。 主表示は「医療・健康」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "accidental-deaths-per-100k",
      "shortLabel": "不慮の事故による死亡者数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人当たりの不慮の事故による死亡者数として定義を示し、補足指標への導線を保持する。 不慮の事故死亡は交通以外も含む健康アウトカムとして扱う。 主表示は「医療・健康」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "police-officer-count-per-population",
      "shortLabel": "警察官数（人口千人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K",
        "surveyedAt": "2026-09-08",
        "rationale": "人口千人当たりの警察官数として定義を示し、補足指標への導線を保持する。"
      }
    },
    {
      "rankingKey": "traffic-accident-injuries",
      "shortLabel": "交通事故負傷者数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "交通事故負傷者数は「交通事故の発生と人的被害」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "crime-count-arrest-rate-trend",
      "componentType": "mixed-chart",
      "title": "刑法犯認知件数（人口千人当たり）と検挙率の推移",
      "componentProps": {
        "columnSeriesRefs": [
          {
            "metricKey": "penal-code-offenses-recognized-per-1000"
          }
        ],
        "lineSeriesRefs": [
          {
            "metricKey": "criminal-arrest-rate"
          }
        ],
        "columnLabels": [
          "認知件数（人口千人当たり）"
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
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "crime",
      "sortOrder": 10,
      "annotation": "刑法犯認知件数は人口千人当たり、検挙率は認知件数に対する検挙件数の割合です。"
    },
    {
      "componentKey": "traffic-accident-deaths-trend",
      "componentType": "line-chart",
      "title": "交通事故 発生件数と負傷者数の推移",
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
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "traffic",
      "sortOrder": 20
    },
    {
      "componentKey": "fire-emergency-trend",
      "componentType": "line-chart",
      "title": "救急出動件数（人口千人当たり）の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "annual-emergency-dispatches-per-1000",
            "label": "救急出動件数（人口千人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "annual-emergency-dispatches-per-1000"
      ],
      "sourceName": "消防統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 30,
      "section": "fire-emergency"
    },
    {
      "componentKey": "fire-emergency-trend-fire",
      "componentType": "line-chart",
      "title": "火災出火件数（人口10万人当たり）の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "building-fire-count-per-100-thousand-people",
            "label": "火災出火件数（人口10万人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "building-fire-count-per-100-thousand-people"
      ],
      "sourceName": "消防統計",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 40,
      "annotation": "現在配信している2023年の人口10万人当たりの火災出火件数です。建物以外の火災も含みます。",
      "section": "fire-emergency"
    },
    {
      "componentKey": "safety-crime-types-donut",
      "componentType": "donut-chart",
      "title": "罪種別 刑法犯認知件数の内訳（2023年）",
      "componentProps": {
        "topN": 5,
        "seriesRefs": [
          {
            "metricKey": "theft-offenses-recognized",
            "label": "窃盗犯",
            "colorRole": "population"
          },
          {
            "metricKey": "violent-crime-per-100k",
            "label": "粗暴犯",
            "colorRole": "count"
          },
          {
            "metricKey": "intellectual-crime-per-100k",
            "label": "知能犯",
            "colorRole": "special"
          },
          {
            "metricKey": "theme-prostitution-crime-recognition-count",
            "label": "風俗犯",
            "colorRole": "series-6"
          },
          {
            "metricKey": "serious-crime-per-100k",
            "label": "凶悪犯",
            "colorRole": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "criminal-recognition-count"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系（警察庁 犯罪統計）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "crime",
      "sortOrder": 50
    },
    {
      "componentKey": "safety-fire-casualties-donut",
      "componentType": "donut-chart",
      "title": "火災による死傷者の内訳（2023年）",
      "componentProps": {
        "topN": 2,
        "seriesRefs": [
          {
            "metricKey": "theme-fire-injured-count",
            "label": "火災負傷者",
            "colorRole": "count"
          },
          {
            "metricKey": "fire-deaths-per-100k",
            "label": "火災死亡者",
            "colorRole": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "fire-deaths-per-100k"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系（消防庁 火災年報）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "fire-emergency",
      "sortOrder": 60
    }
  ],
  "evidenceTopics": [
    {
      "key": "recognized-crime-and-clearance",
      "lensKey": "outcomes",
      "title": "犯罪の認知状況と検挙状況",
      "question": "人口千人当たりの刑法犯認知件数と検挙率には、地域ごとにどのような差があるか",
      "summary": "刑法犯認知件数は警察が犯罪の発生を認知した事件数で、未認知の事件は含みません。主指標と推移図では人口千人当たりの値を使い、罪種別の内訳は総件数で表示します。検挙率は検挙した事件件数を認知件数で割った割合であり、検挙人員の割合ではありません。",
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
  ],
  "sections": [
    {
      "key": "crime",
      "title": "犯罪の認知と検挙",
      "description": "主指標は人口千人当たりの刑法犯認知件数です。検挙率とは別の尺度であり、認知件数には届け出や把握状況も影響します。",
      "metricGroupKeys": [
        "crime-1",
        "crime-2"
      ],
      "chartKeys": [
        "crime-count-arrest-rate-trend",
        "safety-crime-types-donut"
      ]
    },
    {
      "key": "traffic",
      "title": "交通事故の発生と人的被害",
      "description": "主指標は人口10万人当たりの事故件数・死者数・負傷者数です。総件数・総人数の推移図と分けて確認します。",
      "metricGroupKeys": [
        "traffic-1",
        "traffic-2"
      ],
      "chartKeys": [
        "traffic-accident-deaths-trend"
      ]
    },
    {
      "key": "fire-emergency",
      "title": "火災と救急需要",
      "description": "火災は人口10万人当たり、救急出動は人口千人当たりで比較します。火災死傷者の内訳は総人数です。",
      "metricGroupKeys": [
        "fire-emergency-1",
        "fire-emergency-2"
      ],
      "chartKeys": [
        "fire-emergency-trend",
        "fire-emergency-trend-fire",
        "safety-fire-casualties-donut"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "crime-1",
      "title": "刑法犯認知件数（人口千人当たり）",
      "rankingKeys": [
        "penal-code-offenses-recognized-per-1000"
      ],
      "defaultCheckedKeys": [
        "penal-code-offenses-recognized-per-1000"
      ]
    },
    {
      "key": "crime-2",
      "title": "検挙率",
      "rankingKeys": [
        "criminal-arrest-rate"
      ],
      "defaultCheckedKeys": [
        "criminal-arrest-rate"
      ]
    },
    {
      "key": "traffic-1",
      "title": "交通事故死者・負傷者数（人口10万人当たり）",
      "rankingKeys": [
        "traffic-accident-deaths-per-100k",
        "traffic-accident-injuries-per-100k"
      ],
      "defaultCheckedKeys": [
        "traffic-accident-deaths-per-100k",
        "traffic-accident-injuries-per-100k"
      ]
    },
    {
      "key": "traffic-2",
      "title": "交通事故発生件数（人口10万人当たり）",
      "rankingKeys": [
        "traffic-accident-count-per-population"
      ],
      "defaultCheckedKeys": [
        "traffic-accident-count-per-population"
      ]
    },
    {
      "key": "fire-emergency-1",
      "title": "人口当たりの火災・救急出動",
      "rankingKeys": [
        "building-fire-count-per-100-thousand-people",
        "annual-emergency-dispatches-per-1000"
      ],
      "defaultCheckedKeys": [
        "building-fire-count-per-100-thousand-people",
        "annual-emergency-dispatches-per-1000"
      ]
    },
    {
      "key": "fire-emergency-2",
      "title": "火災死者",
      "rankingKeys": [
        "fire-deaths-per-100k"
      ],
      "defaultCheckedKeys": [
        "fire-deaths-per-100k"
      ]
    }
  ]
};
