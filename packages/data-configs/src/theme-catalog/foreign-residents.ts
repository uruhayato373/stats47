import type { ThemeCatalog } from "./types";

export const FOREIGN_RESIDENTS_CATALOG: ThemeCatalog = {
  "key": "foreign-residents",
  "title": "外国人",
  "description": "国勢調査の外国人人口を人口10万人当たりで比較し、国籍別の地域差を把握する。実人数は関連指標で確認できる。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "foreign-resident-count-per-100k",
      "shortLabel": "外国人人口（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした外国人人口として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "foreign-resident-count",
      "shortLabel": "外国人数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "外国人人口の実人数を関連指標で補足する。主章の人口10万人当たり値とは尺度を分ける。"
      }
    },
    {
      "rankingKey": "resident-foreigner-population",
      "shortLabel": "在留外国人",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "在留外国人は「統計の対象の違い」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-china-per-100k",
      "shortLabel": "中国籍人口（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした外国人人口として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-china",
      "shortLabel": "中国(人数)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "国籍別の実人数を関連指標で補足する。主章の人口10万人当たり値とは尺度を分ける。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-korea-per-100k",
      "shortLabel": "韓国・朝鮮籍人口（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした外国人人口として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-korea",
      "shortLabel": "韓国(人数)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "国籍別の実人数を関連指標で補足する。主章の人口10万人当たり値とは尺度を分ける。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-usa-per-100k",
      "shortLabel": "米国籍人口（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした外国人人口として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-usa",
      "shortLabel": "米国(人数)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "国籍別の実人数を関連指標で補足する。主章の人口10万人当たり値とは尺度を分ける。"
      }
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人宿泊",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "宿泊する来訪者と地域に住む外国人は母集団が違う。観光へ移す。 主表示は「観光」へ集約する。関連指標としての導線は保持する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-foreign-total-trend",
      "componentType": "line-chart",
      "title": "外国人人口の推移（人口10万人当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "foreign-resident-count-per-100k",
            "label": "外国人人口（人口10万人当たり）"
          }
        ],
        "labels": [
          "外国人人口（人口10万人当たり）"
        ],
        "seriesColors": [
          "population"
        ]
      },
      "relatedRankingKeys": [
        "foreign-resident-count-per-100k"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "residents",
      "sortOrder": 10,
      "annotation": "国勢調査の外国人人口を総人口10万人当たりで表示します。外国籍の常住者が対象で、在留外国人統計とは対象と基準日が異なります。"
    },
    {
      "componentKey": "theme-foreign-nationality-trend",
      "componentType": "line-chart",
      "title": "国籍別人口の推移（人口10万人当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "foreign-resident-count-china-per-100k",
            "label": "中国籍人口（人口10万人当たり）"
          },
          {
            "metricKey": "foreign-resident-count-korea-per-100k",
            "label": "韓国・朝鮮籍人口（人口10万人当たり）"
          }
        ],
        "labels": [
          "中国籍人口（人口10万人当たり）",
          "韓国・朝鮮籍人口（人口10万人当たり）"
        ],
        "seriesColors": [
          "danger",
          "population"
        ]
      },
      "relatedRankingKeys": [
        "foreign-resident-count-china-per-100k",
        "foreign-resident-count-korea-per-100k"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "nationality",
      "sortOrder": 20,
      "annotation": "総人口10万人当たりの中国籍・韓国・朝鮮籍人口を比較します。外国人人口全体を分母にした国籍構成比ではなく、すべての国籍を網羅するものでもありません。"
    }
  ],
  "evidenceTopics": [
    {
      "key": "foreign-population-scale-and-share",
      "lensKey": "composition",
      "title": "居住する外国人人口の規模",
      "question": "総人口10万人当たりの外国人人口は、地域ごとにどのような違いがあるか。",
      "summary": "国勢調査の外国人人口を総人口10万人当たりで表示します。外国籍の常住者が対象で、在留外国人統計とは対象と基準日が異なります。",
      "sourceKeys": [
        "stat-census-2020-foreign-population"
      ],
      "relatedRankingKeys": [
        "foreign-resident-count",
        "foreign-resident-count-per-100k"
      ],
      "relatedChartKeys": [
        "theme-foreign-total-trend"
      ],
      "relatedThemeKeys": [
        "population-dynamics"
      ]
    },
    {
      "key": "nationality-composition",
      "lensKey": "composition",
      "title": "国籍別に見る外国人人口の地域構成",
      "question": "総人口10万人当たりの中国籍と韓国・朝鮮籍の人口には、どのような地域差があるか。",
      "summary": "総人口10万人当たりの中国籍・韓国・朝鮮籍人口を比較します。外国人人口全体を分母にした国籍構成比ではなく、すべての国籍を網羅するものでもありません。",
      "sourceKeys": [
        "stat-census-2020-foreign-population"
      ],
      "relatedRankingKeys": [
        "foreign-resident-count-china-per-100k",
        "foreign-resident-count-korea-per-100k"
      ],
      "relatedChartKeys": [
        "theme-foreign-nationality-trend"
      ],
      "relatedThemeKeys": [
        "population-dynamics"
      ]
    }
  ],
  "keywords": [
    "外国人",
    "在留外国人",
    "外国人比率",
    "都道府県",
    "ランキング",
    "統計"
  ],
  "sections": [
    {
      "key": "residents",
      "title": "居住する外国人人口",
      "description": "国勢調査の外国人人口を総人口10万人当たりで表示します。外国籍の常住者が対象で、在留外国人統計とは対象と基準日が異なります。",
      "metricGroupKeys": [
        "residents"
      ],
      "chartKeys": [
        "theme-foreign-total-trend"
      ]
    },
    {
      "key": "nationality",
      "title": "国籍別の違い",
      "description": "総人口10万人当たりの中国籍・韓国・朝鮮籍人口を比較します。外国人人口全体を分母にした国籍構成比ではなく、すべての国籍を網羅するものでもありません。",
      "metricGroupKeys": [
        "nationality"
      ],
      "chartKeys": [
        "theme-foreign-nationality-trend"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "residents",
      "title": "外国人人口（人口10万人当たり）",
      "rankingKeys": [
        "foreign-resident-count-per-100k"
      ],
      "defaultCheckedKeys": [
        "foreign-resident-count-per-100k"
      ]
    },
    {
      "key": "nationality",
      "title": "国籍別人口（人口10万人当たり）",
      "rankingKeys": [
        "foreign-resident-count-china-per-100k",
        "foreign-resident-count-korea-per-100k"
      ],
      "defaultCheckedKeys": [
        "foreign-resident-count-china-per-100k",
        "foreign-resident-count-korea-per-100k"
      ]
    }
  ]
};
