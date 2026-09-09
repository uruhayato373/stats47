import type { ThemeCatalog } from "./types";

export const FOREIGN_RESIDENTS_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "外国人人口の規模・分布と、国籍別の違いを比較。",
    "headlineRankingKeys": [
      "foreign-resident-count-per-100k",
      "foreign-resident-count",
      "resident-foreigner-population"
    ],
    "comparisonRankingKeys": [
      "foreign-resident-count-per-100k",
      "foreign-resident-count",
      "resident-foreigner-population",
      "foreign-resident-count-china-per-100k",
      "foreign-resident-count-korea-per-100k",
      "foreign-resident-count-usa-per-100k"
    ],
    "mapNotes": {
      "foreign-resident-count-per-100k": "国勢調査の外国人人口（人口10万人当たり）。％ではありません。",
      "foreign-resident-count": "国勢調査で日本国籍以外に分類された常住者。在留外国人統計とは対象・基準日が異なります。",
      "resident-foreigner-population": "在留外国人統計の人数。国勢調査とは対象・基準日が異なります。",
      "foreign-resident-count-china-per-100k": "総人口10万人当たりの中国籍人口。外国人の中での構成比ではありません。",
      "foreign-resident-count-korea-per-100k": "総人口10万人当たりの韓国・朝鮮籍人口。全外国人人口内の比率ではありません。",
      "foreign-resident-count-usa-per-100k": "総人口10万人当たりの米国籍人口。3国籍で全体にはなりません。"
    }
  },
  "key": "foreign-residents",
  "title": "外国人",
  "description": "都道府県別の在留外国人数・外国人比率・国籍別人口をランキングとチャートで比較。47都道府県の外国人統計を一覧で確認できます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "foreign-resident-count-per-100k",
      "shortLabel": "外国人人口（10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "令和2年国勢調査 人口等基本集計",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        "surveyedAt": "2026-09-09",
        "rationale": "人口規模をそろえた地域分布を最初に示す。比率という短い表示でも実単位は人/10万人を保持する。"
      }
    },
    {
      "rankingKey": "foreign-resident-count",
      "shortLabel": "外国人人口（国勢調査）",
      "role": "primary",
      "selection": {
        "proposedBy": "令和2年国勢調査 人口等基本集計",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        "surveyedAt": "2026-09-09",
        "rationale": "住んでいる外国人人口の規模を人口当たり指標と並べ、大小と濃淡を読み分ける。"
      }
    },
    {
      "rankingKey": "resident-foreigner-population",
      "shortLabel": "在留外国人数",
      "role": "primary",
      "selection": {
        "proposedBy": "社会・人口統計体系（在留外国人統計）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "国勢調査より新しい収録年の行政統計を別指標として示す。国勢調査の人数と足し合わせたり同一時系列として接続しない。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-china-per-100k",
      "shortLabel": "中国籍（10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和2年国勢調査 人口等基本集計",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        "surveyedAt": "2026-09-09",
        "rationale": "国勢調査で比較可能な国籍別の地域分布を表で補う。国籍の全体構成を代表するとは扱わない。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-china",
      "shortLabel": "中国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-korea-per-100k",
      "shortLabel": "韓国・朝鮮籍（10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和2年国勢調査 人口等基本集計",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        "surveyedAt": "2026-09-09",
        "rationale": "中国籍と同じ分母で国籍別の違いを比較する。ラベルは韓国だけでなく韓国・朝鮮とする。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-korea",
      "shortLabel": "韓国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "foreign-resident-count-usa-per-100k",
      "shortLabel": "米国籍（10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和2年国勢調査 人口等基本集計",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        "surveyedAt": "2026-09-09",
        "rationale": "既存収録の国籍別人口を比較表に補い、特定2国籍だけを全体構成と誤読しないようにする。"
      }
    },
    {
      "rankingKey": "foreign-resident-count-usa",
      "shortLabel": "米国(人数)",
      "role": "context"
    },
    {
      "rankingKey": "total-overnight-guests-foreign",
      "shortLabel": "外国人宿泊",
      "role": "context"
    }
  ],
  "charts": [
    {
      "componentKey": "theme-foreign-nationality-trend",
      "componentType": "line-chart",
      "title": "中国籍・韓国朝鮮籍の人口推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "foreign-resident-count-china-per-100k",
            "label": "中国籍（10万人当たり）"
          },
          {
            "metricKey": "foreign-resident-count-korea-per-100k",
            "label": "韓国・朝鮮籍（10万人当たり）"
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
      "sortOrder": 0,
      "annotation": "各県の総人口10万人当たり。2国籍は外国人人口全体の内訳を網羅していません。"
    }
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
      "relatedChartKeys": [],
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
