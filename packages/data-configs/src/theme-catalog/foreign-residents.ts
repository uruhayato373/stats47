import type { ThemeCatalog } from "./types";

export const FOREIGN_RESIDENTS_CATALOG: ThemeCatalog = {
  "key": "foreign-residents",
  "title": "外国人",
  "description": "都道府県別の在留外国人数・外国人比率・国籍別人口をランキングとチャートで比較。47都道府県の外国人統計を一覧で確認できます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "foreign-resident-count-per-100k",
      "shortLabel": "外国人比率",
      "role": "primary"
    },
    {
      "rankingKey": "foreign-resident-count",
      "shortLabel": "外国人数",
      "role": "secondary"
    },
    {
      "rankingKey": "resident-foreigner-population",
      "shortLabel": "在留外国人",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-china-per-100k",
      "shortLabel": "中国(比率)",
      "role": "secondary"
    },
    {
      "rankingKey": "foreign-resident-count-china",
      "shortLabel": "中国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-korea-per-100k",
      "shortLabel": "韓国(比率)",
      "role": "secondary"
    },
    {
      "rankingKey": "foreign-resident-count-korea",
      "shortLabel": "韓国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-usa-per-100k",
      "shortLabel": "米国(比率)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-usa",
      "shortLabel": "米国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人宿泊",
      "role": "secondary"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-foreign-total-trend",
      "componentType": "line-chart",
      "title": "外国人比率と外国人数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010201",
            "cdCat01": "#A01601"
          },
          {
            "statsDataId": "0000010101",
            "cdCat01": "A1700"
          }
        ],
        "labels": [
          "外国人比率(10万人当たり)",
          "外国人数"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "foreign-resident-count-per-100k",
        "foreign-resident-count"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "総数",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-foreign-nationality-trend",
      "componentType": "line-chart",
      "title": "国籍別外国人比率の推移（10万人当たり）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010201",
            "cdCat01": "#A0160102"
          },
          {
            "statsDataId": "0000010201",
            "cdCat01": "#A0160101"
          }
        ],
        "labels": [
          "中国",
          "韓国・朝鮮"
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
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "国籍別",
      "sortOrder": 0
    },
],
  "evidenceTopics": [
    {
      "key": "foreign-population-scale-and-share",
      "lensKey": "composition",
      "title": "人数と人口規模あたりの外国人人口",
      "question": "外国人人口の総数と人口10万人当たりの値では、地域の見え方がどう変わるか。",
      "summary": "国勢調査で日本国籍以外に分類された常住者を、総数と人口規模当たりで読み分けます。在留カード等を基にする在留外国人統計とは対象と時点が異なります。",
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
      "question": "中国籍と韓国・朝鮮籍の人口規模当たりの値には、どのような地域差があるか。",
      "summary": "国勢調査の中国籍と韓国・朝鮮籍を人口10万人当たりで比較します。すべての国籍や在留資格別の構成を示すチャートではありません。",
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
  ]
};
