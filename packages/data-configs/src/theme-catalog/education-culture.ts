import type { ThemeCatalog } from "./types";

export const EDUCATION_CULTURE_CATALOG: ThemeCatalog = {
  "key": "education-culture",
  "title": "教育・文化",
  "description": "都道府県別の小学校数・中学校数・高等学校数・図書館数・公民館数をランキングとチャートで比較。教育・文化施設の地域差を47都道府県のデータで確認できます。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "library-count-per-million",
      "shortLabel": "図書館",
      "role": "primary"
    },
    {
      "rankingKey": "elementary-school-count-per-100km2-habitable",
      "shortLabel": "小学校",
      "role": "secondary"
    },
    {
      "rankingKey": "junior-high-school-count-per-100km2-habitable",
      "shortLabel": "中学校",
      "role": "secondary"
    },
    {
      "rankingKey": "high-school-count-per-100km2-habitable",
      "shortLabel": "高等学校",
      "role": "secondary"
    },
    {
      "rankingKey": "public-hall-count-per-million",
      "shortLabel": "公民館",
      "role": "secondary"
    },
    {
      "rankingKey": "final-education-university-graduate-school-ratio",
      "shortLabel": "大学・大学院卒",
      "role": "context"
    },
    {
      "rankingKey": "in-pref-university-entrance-ratio-by-highschool-origin",
      "shortLabel": "県内大学進学率",
      "role": "context"
    }
  ],
  metricGroups: [
    {
      key: "school-facilities",
      title: "学校施設",
      rankingKeys: [
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable",
        "high-school-count-per-100km2-habitable",
      ],
      defaultCheckedKeys: [
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable",
        "high-school-count-per-100km2-habitable",
      ],
    },
    {
      key: "cultural-facilities",
      title: "文化施設",
      rankingKeys: [
        "library-count-per-million",
        "public-hall-count-per-million",
      ],
      defaultCheckedKeys: [
        "library-count-per-million",
        "public-hall-count-per-million",
      ],
    },
  ],
  "charts": [
    {
      "componentKey": "theme-edu-higher-education-trend",
      "componentType": "line-chart",
      "title": "教育到達と県内大学進学率の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E09504"
          },
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E0940302"
          }
        ],
        "labels": [
          "大学・大学院卒の割合",
          "県内大学進学率"
        ],
        "seriesColors": [
          "population",
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "final-education-university-graduate-school-ratio",
        "in-pref-university-entrance-ratio-by-highschool-origin"
      ],
      "sourceName": "総務省 社会・人口統計体系（学校基本調査）",
      "sourceLink": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
    {
      "componentKey": "theme-edu-school-type-breakdown",
      "componentType": "donut-chart",
      "title": "学校種別の構成（最新年）",
      "componentProps": {
        "statsDataId": "0000010105",
        "categories": [
          {
            "code": "E2101",
            "label": "小学校",
            "color": "population"
          },
          {
            "code": "E3101",
            "label": "中学校",
            "color": "danger"
          },
          {
            "code": "E4101",
            "label": "高等学校",
            "color": "improve"
          },
          {
            "code": "E6101",
            "label": "短期大学",
            "color": "count"
          },
          {
            "code": "E6102",
            "label": "大学",
            "color": "special"
          }
        ],
        "topN": 5
      },
      "sourceName": "総務省 社会・人口統計体系（学校基本調査）",
      "sourceLink": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
      "rankingLink": "/ranking/university-count",
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
      key: "facility-access",
      lensKey: "regional-access",
      title: "教育・文化施設への地域アクセス",
      question:
        "人口や可住地面積を基準にすると、施設の配置は地域ごとにどう異なるか",
      summary:
        "学校・図書館・公民館は、実数だけでなく対象人口と居住可能な面積を分けて比較します。",
      sourceKeys: ["mext-whitepaper-2024", "mext-statistical-overview-2024"],
      relatedRankingKeys: [
        "library-count-per-million",
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable",
        "high-school-count-per-100km2-habitable",
        "public-hall-count-per-million",
      ],
      relatedThemeKeys: ["population-dynamics", "living-housing"],
    },
    {
      key: "higher-education-mobility",
      lensKey: "mobility",
      title: "高等教育への進学と地域移動",
      question: "教育到達と県内進学は、地域ごとにどのような違いを示すか",
      summary:
        "大学進学に関する割合を、最終学歴と県内進学という異なる問いに分けて読みます。",
      sourceKeys: ["mext-whitepaper-2024", "mext-school-basic-survey-2024"],
      relatedRankingKeys: [
        "final-education-university-graduate-school-ratio",
        "in-pref-university-entrance-ratio-by-highschool-origin",
      ],
      relatedChartKeys: ["theme-edu-higher-education-trend"],
      relatedThemeKeys: ["labor-mobility", "population-dynamics"],
    },
  ],
  "keywords": [
    "学校数",
    "図書館",
    "公民館",
    "教育",
    "文化施設",
    "都道府県",
    "ランキング"
  ]
};
