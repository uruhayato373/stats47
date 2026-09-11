import type { ThemeCatalog } from "./types";

export const EDUCATION_CULTURE_CATALOG: ThemeCatalog = {
  "key": "education-culture",
  "title": "教育・文化",
  "description": "学校・高等教育への進路・文化施設を分け、地域の学ぶ基盤を比較する。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "library-count-per-million",
      "shortLabel": "図書館数（人口100万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/G",
        "surveyedAt": "2026-09-08",
        "rationale": "人口100万人を基準にした図書館数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "elementary-school-count-per-100km2-habitable",
      "shortLabel": "小学校数（可住地100km²当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/E",
        "surveyedAt": "2026-09-08",
        "rationale": "可住地100km²を基準にした小学校数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "junior-high-school-count-per-100km2-habitable",
      "shortLabel": "中学校数（可住地100km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/E",
        "surveyedAt": "2026-09-08",
        "rationale": "可住地100km²を基準にした中学校数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "high-school-count-per-100km2-habitable",
      "shortLabel": "高等学校数（可住地100km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/E",
        "surveyedAt": "2026-09-08",
        "rationale": "可住地100km²を基準にした高等学校数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "public-hall-count-per-million",
      "shortLabel": "公民館数（人口100万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/G",
        "surveyedAt": "2026-09-08",
        "rationale": "人口100万人を基準にした公民館数として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "final-education-university-graduate-school-ratio",
      "shortLabel": "大学・大学院卒割合（卒業者総数中）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/E",
        "surveyedAt": "2026-09-08",
        "rationale": "卒業者総数を基準にした最終学歴が大学・大学院卒の者の割合として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "in-pref-university-entrance-ratio-by-highschool-origin",
      "shortLabel": "県内大学入学割合（同県出身入学者中）",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/E",
        "surveyedAt": "2026-09-08",
        "rationale": "同県出身入学者を基準にした県内大学入学者割合として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "university-count",
      "shortLabel": "大学数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "大学数は「高等教育へどう進むか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "elementary-school-count",
      "shortLabel": "小学校数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "小学校数は「学校数の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "junior-high-school-count",
      "shortLabel": "中学校数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "中学校数は「学校数の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "high-school-count",
      "shortLabel": "高等学校数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高等学校数は「学校数の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "junior-college-count",
      "shortLabel": "短期大学数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "短期大学数は「学校数の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "elementary-school-students-per-teacher",
      "shortLabel": "教員1人当たり小学校児童数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "施設密度とは異なる学習環境の量的条件を補う。"
      }
    },
    {
      "rankingKey": "hobby-participation-rate-theater",
      "shortLabel": "演芸・演劇・舞踊鑑賞の行動者率（10歳以上）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/stat-search/database?layout=dataset&statdisp_id=0003456573",
        "surveyedAt": "2026-09-08",
        "rationale": "文化施設数に偏る現行構成へ住民の行動を1つ補う。"
      }
    }
  ],
  "metricGroups": [
    {
      "key": "schools-1",
      "title": "学校数（可住地100km²当たり）",
      "rankingKeys": [
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable",
        "high-school-count-per-100km2-habitable"
      ],
      "defaultCheckedKeys": [
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable"
      ]
    },
    {
      "key": "schools-2",
      "title": "教員1人当たり小学校児童数",
      "rankingKeys": [
        "elementary-school-students-per-teacher"
      ],
      "defaultCheckedKeys": [
        "elementary-school-students-per-teacher"
      ]
    },
    {
      "key": "higher-education",
      "title": "県内大学入学割合（同県出身入学者中）",
      "rankingKeys": [
        "in-pref-university-entrance-ratio-by-highschool-origin"
      ],
      "defaultCheckedKeys": [
        "in-pref-university-entrance-ratio-by-highschool-origin"
      ]
    },
    {
      "key": "culture-1",
      "title": "図書館・公民館数（人口100万人当たり）",
      "rankingKeys": [
        "library-count-per-million",
        "public-hall-count-per-million"
      ],
      "defaultCheckedKeys": [
        "library-count-per-million",
        "public-hall-count-per-million"
      ]
    },
    {
      "key": "culture-2",
      "title": "演芸・演劇・舞踊鑑賞の行動者率（10歳以上）",
      "rankingKeys": [
        "hobby-participation-rate-theater"
      ],
      "defaultCheckedKeys": [
        "hobby-participation-rate-theater"
      ]
    }
  ],
  "charts": [
    {
      "componentKey": "theme-edu-higher-education-trend",
      "componentType": "line-chart",
      "title": "大学入学者の県内入学割合の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "in-pref-university-entrance-ratio-by-highschool-origin",
            "label": "県内大学入学割合（同県出身入学者中）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "in-pref-university-entrance-ratio-by-highschool-origin"
      ],
      "sourceName": "総務省 社会・人口統計体系（学校基本調査）",
      "sourceLink": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "annotation": "当該県の高校出身の大学入学者が分母です。そのうち同じ県の大学へ入学した割合を示し、高校卒業者全体の大学進学率ではありません。",
      "section": "higher-education"
    },
    {
      "componentKey": "theme-edu-higher-education-trend-attainment",
      "componentType": "line-chart",
      "title": "卒業者総数に占める大学・大学院卒割合",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "final-education-university-graduate-school-ratio",
            "label": "大学・大学院卒割合（卒業者総数中）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "final-education-university-graduate-school-ratio"
      ],
      "sourceName": "総務省 社会・人口統計体系（国勢調査）",
      "sourceLink": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/E",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 20,
      "annotation": "国勢調査の最終学歴における卒業者総数が分母です。住民全員や当年の高校卒業者・大学入学者に対する割合ではありません。",
      "section": "higher-education"
    }
  ],
  "evidenceTopics": [
    {
      "key": "facility-access",
      "lensKey": "regional-access",
      "title": "教育・文化施設への地域アクセス",
      "question": "人口や可住地面積を基準にすると、施設の配置は地域ごとにどう異なるか",
      "summary": "学校は可住地100km²当たり、図書館・公民館は人口100万人当たりの数として配置を比較します。施設の実数は関連指標で補足します。",
      "sourceKeys": [
        "mext-whitepaper-2024",
        "mext-statistical-overview-2024"
      ],
      "relatedRankingKeys": [
        "library-count-per-million",
        "elementary-school-count-per-100km2-habitable",
        "junior-high-school-count-per-100km2-habitable",
        "high-school-count-per-100km2-habitable",
        "public-hall-count-per-million"
      ],
      "relatedThemeKeys": [
        "population-dynamics",
        "living-housing"
      ]
    },
    {
      "key": "higher-education-mobility",
      "lensKey": "mobility",
      "title": "高等教育への進学と地域移動",
      "question": "教育到達と県内進学は、地域ごとにどのような違いを示すか",
      "summary": "当該県の高校出身大学入学者に占める県内大学入学者の割合と、卒業者総数に占める大学・大学院卒の割合は、対象・分母が異なります。",
      "sourceKeys": [
        "mext-whitepaper-2024",
        "mext-school-basic-survey-2024"
      ],
      "relatedRankingKeys": [
        "final-education-university-graduate-school-ratio",
        "in-pref-university-entrance-ratio-by-highschool-origin"
      ],
      "relatedChartKeys": [
        "theme-edu-higher-education-trend"
      ],
      "relatedThemeKeys": [
        "labor-mobility",
        "population-dynamics"
      ]
    },
    {
      "key": "education-investment-efficiency",
      "lensKey": "equity",
      "title": "教育費のかけ方と国公立大学への進学",
      "question": "補習教育にかける支出と国公立大学の授業料支出は、県庁所在市ごとにどう組み合わさっているか",
      "summary": "家計調査の教育費は、子どもの有無を問わない二人以上世帯の平均で、県全体ではなく県庁所在市の値です。補習教育（幼児・小学校、中学校、高校・予備校）と大学授業料（国公立・私立）を分けて読み、支出の多さを教育水準の高さと同一視しません。",
      "sourceKeys": [
        "stat-family-income-expenditure-survey-2024",
        "mext-school-basic-survey-2024"
      ],
      "relatedRankingKeys": [
        "public-university-consumption-expenditure",
        "private-university-consumption-expenditure",
        "elementary-tutoring-consumption-expenditure",
        "junior-high-tutoring-consumption-expenditure",
        "high-school-tutoring-consumption-expenditure",
        "high-school-advancement-rate",
        "high-school-new-graduates-employment-rate"
      ],
      "relatedThemeKeys": [
        "real-income",
        "population-dynamics"
      ]
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
  ],
  "sections": [
    {
      "key": "schools",
      "title": "学校の配置と規模",
      "description": "可住地100km²当たりの学校数と教員1人当たり小学校児童数を分けて確認します。教員1人当たり児童数は1学級の児童数ではありません。",
      "metricGroupKeys": [
        "schools-1",
        "schools-2"
      ],
      "chartKeys": []
    },
    {
      "key": "higher-education",
      "title": "高等教育へどう進むか",
      "description": "当該県の高校出身大学入学者に占める県内大学入学者の割合と、卒業者総数に占める大学・大学院卒の割合は、対象・分母が異なります。",
      "metricGroupKeys": [
        "higher-education"
      ],
      "chartKeys": [
        "theme-edu-higher-education-trend",
        "theme-edu-higher-education-trend-attainment"
      ]
    },
    {
      "key": "culture",
      "title": "文化・社会教育の施設",
      "description": "人口100万人当たりの図書館・公民館数と住民の鑑賞行動を分けて確認します。鑑賞行動者率は10歳以上の演芸・演劇・舞踊等が対象で、2021年の感染症流行下の調査です。",
      "metricGroupKeys": [
        "culture-1",
        "culture-2"
      ],
      "chartKeys": []
    }
  ]
};
