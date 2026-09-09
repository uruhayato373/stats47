import type { ThemeCatalog } from "./types";

export const EDUCATION_CULTURE_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "学校・文化施設の配置と、進学を比較。",
    "headlineRankingKeys": [
      "elementary-school-count-per-100km2-habitable",
      "library-count-per-million",
      "public-hall-count-per-million",
      "in-pref-university-entrance-ratio-by-highschool-origin"
    ],
    "comparisonRankingKeys": [
      "elementary-school-count-per-100km2-habitable",
      "library-count-per-million",
      "public-hall-count-per-million",
      "in-pref-university-entrance-ratio-by-highschool-origin",
      "junior-high-school-count-per-100km2-habitable",
      "high-school-count-per-100km2-habitable",
      "final-education-university-graduate-school-ratio",
      "university-count"
    ],
    "mapNotes": {
      "elementary-school-count-per-100km2-habitable": "可住地100km²当たりの小学校数。児童当たりの数や通学時間ではありません。",
      "library-count-per-million": "人口100万人当たりの図書館数。蔵書や利用者数は示しません。",
      "public-hall-count-per-million": "人口100万人当たりの公民館数。人口減少でも値が上がることがあります。",
      "in-pref-university-entrance-ratio-by-highschool-origin": "県内高校出身の大学入学者のうち、県内大学へ入学した割合。",
      "junior-high-school-count-per-100km2-habitable": "可住地100km²当たりの中学校数。生徒当たりの数ではありません。",
      "high-school-count-per-100km2-habitable": "可住地100km²当たりの高等学校数。進学率や教育成果とは別です。",
      "final-education-university-graduate-school-ratio": "最終学歴の卒業者総数に占める大学・大学院卒。現在の進学率とは別です。",
      "university-count": "大学の数。学生数や進学定員ではありません。"
    }
  },
  "key": "education-culture",
  "title": "教育・文化",
  "description": "都道府県別の小学校数・中学校数・高等学校数・図書館数・公民館数をランキングとチャートで比較。教育・文化施設の地域差を47都道府県のデータで確認できます。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "library-count-per-million",
      "shortLabel": "図書館（100万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "文部科学統計要覧（令和6年版）",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/002/002b/1417059_00009.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "文化施設への供給を人口規模で比較する代表指標。学力や利用実績と区別する。"
      }
    },
    {
      "rankingKey": "elementary-school-count-per-100km2-habitable",
      "shortLabel": "小学校（可住地100km²当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "文部科学統計要覧・学校基本調査",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "学校の配置を面積で比較し、県の規模に依存する学校総数の代わりに概況へ採用。"
      }
    },
    {
      "rankingKey": "junior-high-school-count-per-100km2-habitable",
      "shortLabel": "中学校（可住地100km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "学校基本調査 令和6年度結果",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "小学校との学校段階の違いを、同じ分母で比較表へ補う。"
      }
    },
    {
      "rankingKey": "high-school-count-per-100km2-habitable",
      "shortLabel": "高校（可住地100km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "学校基本調査 令和6年度結果",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "中学校までとは異なる配置密度を同じ面積基準で補助比較する。"
      }
    },
    {
      "rankingKey": "public-hall-count-per-million",
      "shortLabel": "公民館（100万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "文部科学統計要覧（令和6年版）",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/002/002b/1417059_00009.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "図書館と異なる地域の学習・活動拠点を比較する。施設数だけで文化活動を評価しない。"
      }
    },
    {
      "rankingKey": "final-education-university-graduate-school-ratio",
      "shortLabel": "大学・大学院卒割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和2年国勢調査・社会人口統計体系",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
        "surveyedAt": "2026-09-09",
        "rationale": "現住者の教育到達を県内大学への入学割合と別の問いとして表で示す。"
      }
    },
    {
      "rankingKey": "in-pref-university-entrance-ratio-by-highschool-origin",
      "shortLabel": "県内大学入学者割合",
      "role": "primary",
      "selection": {
        "proposedBy": "学校基本調査 令和6年度結果",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "学校配置から高等教育への地域移動につなぐ代表指標。高校卒業者全体の大学進学率とは区別する。"
      }
    },
    {
      "rankingKey": "university-count",
      "shortLabel": "大学数",
      "role": "secondary",
      "selection": {
        "proposedBy": "学校基本調査 令和6年度結果",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "県内大学入学者割合の背景として高等教育機関の供給を比較表で補う。"
      }
    },
    {
      "rankingKey": "elementary-school-count",
      "shortLabel": "小学校数",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-school-count",
      "shortLabel": "中学校数",
      "role": "context"
    },
    {
      "rankingKey": "high-school-count",
      "shortLabel": "高等学校数",
      "role": "context"
    },
    {
      "rankingKey": "junior-college-count",
      "shortLabel": "短期大学数",
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
  "charts": [],
  evidenceTopics: [
    {
      "key": "facility-access",
      "lensKey": "regional-access",
      "title": "教育・文化施設への地域アクセス",
      "question": "人口や可住地面積を基準にすると、施設の配置は地域ごとにどう異なるか",
      "summary": "学校・図書館・公民館は、実数だけでなく対象人口と居住可能な面積を分けて比較します。",
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
      "summary": "大学進学に関する割合を、最終学歴と県内進学という異なる問いに分けて読みます。",
      "sourceKeys": [
        "mext-whitepaper-2024",
        "mext-school-basic-survey-2024"
      ],
      "relatedRankingKeys": [
        "final-education-university-graduate-school-ratio",
        "in-pref-university-entrance-ratio-by-highschool-origin"
      ],
      "relatedChartKeys": [],
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
  ]
};
