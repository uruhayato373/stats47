import type { ThemeCatalog } from "./types";

// Migrated 2026-07-04 from IndicatorSet + page-components JSON (byte-exact round-trip verified).
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
    }
  ],
  "panelTabs": [
    {
      "label": "学校",
      "rankingKeys": [
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable",
        "high-school-count-per-100km2-habitable"
      ]
    },
    {
      "label": "文化施設",
      "rankingKeys": [
        "library-count-per-million",
        "public-hall-count-per-million"
      ]
    },
    {
      "label": "考察",
      "rankingKeys": []
    }
  ],
  "charts": [
    {
      "componentKey": "theme-edu-school-trend",
      "componentType": "line-chart",
      "title": "学校数の推移（可住地面積100km²当たり）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E0110201"
          },
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E0110202"
          },
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E0110203"
          }
        ],
        "labels": [
          "小学校",
          "中学校",
          "高等学校"
        ],
        "seriesColors": [
          "#3b82f6",
          "#22c55e",
          "#f59e0b"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "学校",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-edu-culture-trend",
      "componentType": "line-chart",
      "title": "文化施設数の推移（人口100万人当たり）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010207",
            "cdCat01": "#G01104"
          },
          {
            "statsDataId": "0000010207",
            "cdCat01": "#G01101"
          }
        ],
        "labels": [
          "図書館",
          "公民館"
        ],
        "seriesColors": [
          "#3b82f6",
          "#f59e0b"
        ]
      },
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "rankingLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "文化施設",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-edu-university-enrollment-trend",
      "componentType": "line-chart",
      "title": "最終学歴が大学・大学院卒の割合の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E09504"
          }
        ],
        "labels": [
          "大学・大学院卒の割合"
        ],
        "seriesColors": [
          "#3b82f6"
        ]
      },
      "sourceName": "総務省 社会・人口統計体系（学校基本調査）",
      "sourceLink": null,
      "rankingLink": "/ranking/final-education-university-graduate-school-ratio",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 10
    },
    {
      "componentKey": "theme-edu-in-pref-university-trend",
      "componentType": "line-chart",
      "title": "県内大学進学率の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010205",
            "cdCat01": "#E0940302"
          }
        ],
        "labels": [
          "県内大学進学率"
        ],
        "seriesColors": [
          "#ef4444"
        ]
      },
      "sourceName": "総務省 社会・人口統計体系（学校基本調査）",
      "sourceLink": null,
      "rankingLink": "/ranking/in-pref-university-entrance-ratio-by-highschool-origin",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20
    },
    {
      "componentKey": "theme-edu-school-type-breakdown",
      "componentType": "donut-chart",
      "title": "学校種別の学校数（最新年）",
      "componentProps": {
        "statsDataId": "0000010105",
        "categories": [
          {
            "code": "E2101",
            "label": "小学校",
            "color": "#3b82f6"
          },
          {
            "code": "E3101",
            "label": "中学校",
            "color": "#ef4444"
          },
          {
            "code": "E4101",
            "label": "高等学校",
            "color": "#22c55e"
          },
          {
            "code": "E6101",
            "label": "短期大学",
            "color": "#f59e0b"
          },
          {
            "code": "E6102",
            "label": "大学",
            "color": "#8b5cf6"
          }
        ],
        "topN": 5
      },
      "sourceName": "総務省 社会・人口統計体系（学校基本調査）",
      "sourceLink": null,
      "rankingLink": "/ranking/university-count",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 30
    }
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
