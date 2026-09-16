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
        "proposedBy": "文部科学省「社会教育調査-調査の概要」調査対象の範囲（図書館調査票の対象）",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa02/shakai/gaiyou/chousa/1268405.htm",
        "surveyedAt": "2026-09-16",
        "rationale": "文部科学省の社会教育調査は図書館法第2条に基づく図書館を公式な調査対象と定義しており、図書館数はこの基幹統計に基づく全国共通基準の施設カウントである。人口100万人当たりに換算した図書館数は、都道府県間で読書・学習環境の整備水準を同一基準で比較できる代表的な指標であり、「図書館と読書環境」の章で地域の学ぶ基盤を測る中心的な物差しとなる。",
        "adoptionCriteria": ["representativeness", "comparability", "dataQuality"],
        "readerQuestion": "自分の県は人口あたりでどれくらい図書館があるのか、他県と比べて多いのか少ないのか。",
        "targetReaderOrDecision": "地域の読書・学習環境を比較したい住民や自治体担当者。"
      }
    },
    {
      "rankingKey": "elementary-school-count-per-100km2-habitable",
      "shortLabel": "小学校数（可住地100km²当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "文部科学省「公立小学校・中学校の適正規模・適正配置等に関する手引の策定について（通知）」（平成27年1月）",
        "sourceUrl": "https://www.mext.go.jp/a_menu/shotou/shugaku/detail/1354768.htm",
        "surveyedAt": "2026-09-16",
        "rationale": "文部科学省はこの通知で、少子化の進展に伴う学校の小規模化を全国的な政策課題として位置付けており、市町村が学校統合の適否を検討する際の基本的な考え方を示している。可住地面積当たりの小学校数は、この小規模化・統廃合の実態が地域ごとにどの密度で表れているかを比較する土台であり、「学校の配置と規模」の章の代表指標となる。",
        "adoptionCriteria": ["representativeness", "comparability", "readerValue"],
        "readerQuestion": "自分の地域では可住地面積当たりの小学校数は多いのか、統廃合が進みやすい状況にあるのか。",
        "targetReaderOrDecision": "学校配置や統廃合の議論に関心を持つ保護者・自治体関係者。"
      }
    },
    {
      "rankingKey": "junior-high-school-count-per-100km2-habitable",
      "shortLabel": "中学校数（可住地100km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "文部科学省「公立小学校・中学校の適正規模・適正配置等に関する手引の策定について（通知）」（平成27年1月）",
        "sourceUrl": "https://www.mext.go.jp/a_menu/shotou/shugaku/detail/1354768.htm",
        "surveyedAt": "2026-09-16",
        "rationale": "この通知は学校教育法施行規則に基づき小学校（第41条）と中学校（第79条）の学級数の標準や通学距離の条件を国が共通して示してきたことを述べており、中学校数も小学校と同じ制度的枠組みで配置が規定されている。可住地面積当たりの中学校数は、義務教育後期の通学圏の密度を小学校数とは別の角度から確認できる補完的な指標であり、地域間の学校配置の違いを多面的に捉えるのに役立つ。",
        "adoptionCriteria": ["comparability", "complementarity", "dataQuality"],
        "readerQuestion": "中学校は可住地面積当たりでどれくらいの密度で配置されており、小学校の配置と傾向は似ているか。",
        "targetReaderOrDecision": "義務教育段階の学校配置を小中で比較したい教育行政担当者。"
      }
    },
    {
      "rankingKey": "high-school-count-per-100km2-habitable",
      "shortLabel": "高等学校数（可住地100km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "文部科学省「学制百年史」二　高等学校における学級編制基準（高校標準法の制定）",
        "sourceUrl": "https://www.mext.go.jp/b_menu/hakusho/html/others/detail/1318350.htm",
        "surveyedAt": "2026-09-16",
        "rationale": "文部科学省の記述によれば、高等学校は制定当初から法律名に「適正配置」を明記した高校標準法によって、設置基準や配置のあり方が国レベルで規律されてきた学校種である。可住地面積当たりの高等学校数は、この法制度の下で地域ごとにどの密度で高校が配置されているかを示す指標であり、小学校・中学校とは異なる通学圏・進学選択の実態を補完的に描く。",
        "adoptionCriteria": ["comparability", "complementarity", "dataQuality"],
        "readerQuestion": "高校は可住地面積当たりでどれくらいの密度で配置されており、通学の選択肢はどの程度あるか。",
        "targetReaderOrDecision": "高校進学時の通学圏や学校配置政策を検討する保護者・教育行政担当者。"
      }
    },
    {
      "rankingKey": "public-hall-count-per-million",
      "shortLabel": "公民館数（人口100万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "文部科学省「社会教育調査-調査の概要」調査対象の範囲（公民館調査票の対象）",
        "sourceUrl": "https://www.mext.go.jp/b_menu/toukei/chousa02/shakai/gaiyou/chousa/1268405.htm",
        "surveyedAt": "2026-09-16",
        "rationale": "公民館は社会教育法第21条に基づき設置される施設として社会教育調査の対象に明確に定義されており、全国共通の基準で数えられる社会教育インフラである。人口100万人当たりの公民館数は、図書館とは異なる生涯学習・地域活動の拠点整備状況を示す補完的な指標であり、地域差を捉えるうえで図書館数だけでは見えない側面を補う。",
        "adoptionCriteria": ["comparability", "complementarity", "dataQuality"],
        "readerQuestion": "自分の地域には人口比でどれくらい公民館があり、生涯学習の拠点は充実しているか。",
        "targetReaderOrDecision": "生涯学習・地域活動の場を探す住民や公民館政策の担当者。"
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
        "proposedBy": "政府統計の総合窓口（e-Stat）社会・人口統計体系 都道府県データ「社会生活統計指標 Ｅ 教育」統計表",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010205",
        "surveyedAt": "2026-09-16",
        "rationale": "この指標はe-Statの社会・人口統計体系において、大学入学者数を分母に出身高校所在地県内の大学への入学者割合として定義されており、都道府県間で同一の定義に基づき比較できる。県内大学入学割合は、高校卒業後に地元に留まって進学するか県外に出るかという地域移動の実態を表す代表指標であり、「高等教育へどう進むか」「大学と地域人材」の章の中心的な問いに直結する。",
        "adoptionCriteria": ["representativeness", "comparability", "readerValue"],
        "readerQuestion": "自分の県の高校出身者は、大学進学時にどれくらい県内に留まっているか。",
        "targetReaderOrDecision": "地元進学・地域人材の定着状況を確認したい高校生・保護者・地域政策担当者。"
      }
    },
    {
      "rankingKey": "university-count",
      "shortLabel": "大学数",
      "role": "context",
      "selection": {
        "proposedBy": "学校基本調査（政府統計の総合窓口 e-Stat 掲載「調査の概要」、文部科学省実施）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003274920",
        "surveyedAt": "2026-09-16",
        "rationale": "学校基本調査は大学を含む全学校種を毎年全数調査する枠組みであり、大学数は都道府県ごとに高等教育機関がどれだけ立地しているかを示す基礎的な数量である。これは「高等教育へどう進むか」「大学と地域人材」という章立ての前提となる立地規模の把握に資する。",
        "adoptionCriteria": ["comparability", "dataQuality"],
        "readerQuestion": "自分の都道府県には大学がどれくらいあるのか。",
        "targetReaderOrDecision": "地域の高等教育機関の立地規模を知りたい読者。"
      }
    },
    {
      "rankingKey": "elementary-school-count",
      "shortLabel": "小学校数",
      "role": "context",
      "selection": {
        "proposedBy": "文部科学省が令和6年度学校基本調査結果を公表（NIC-Japan、高等教育資格承認情報センター）",
        "sourceUrl": "https://www.nicjp.niad.ac.jp/news/schoolbasicsurvey2024.html",
        "surveyedAt": "2026-09-16",
        "rationale": "学校基本調査の最新結果は小学校数が全国的に減少し続けている実態を示しており、都道府県別の小学校数はその地域で義務教育の初期課程の学びの基盤が維持・縮小しているかを表す指標になる。これは「学校の配置と規模」の章での地域比較に直結する。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の地域の小学校数は減っているのか、他地域と比べて多いのか少ないのか。",
        "targetReaderOrDecision": "地域の学校配置の変化を把握したい保護者や自治体担当者。"
      }
    },
    {
      "rankingKey": "junior-high-school-count",
      "shortLabel": "中学校数",
      "role": "context",
      "selection": {
        "proposedBy": "文部科学省が令和6年度学校基本調査結果を公表（NIC-Japan、高等教育資格承認情報センター）",
        "sourceUrl": "https://www.nicjp.niad.ac.jp/news/schoolbasicsurvey2024.html",
        "surveyedAt": "2026-09-16",
        "rationale": "同資料は中学校数も小学校と同様に減少傾向にあると述べており、義務教育後期課程の施設規模を都道府県別に比較することで、地域ごとの学校統合・廃止の進み方の違いを捉えられる。これは小学校数と対をなし「学校の配置と規模」を補完する。",
        "adoptionCriteria": ["representativeness", "complementarity"],
        "readerQuestion": "中学校の数は小学校と同じペースで減っているのか。",
        "targetReaderOrDecision": "義務教育後期課程の施設規模の地域差を確認したい自治体担当者。"
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
        "proposedBy": "令和3年社会生活基本調査結果報告-調査の概要・用語と分類-（総務省統計局調査、茨城県掲載）",
        "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/syakai/syakaichor3/furoku.html",
        "surveyedAt": "2026-09-16",
        "rationale": "社会生活基本調査は演芸・演劇・舞踊鑑賞をテレビ視聴等と明確に区別し、現地での鑑賞行動として定義している。この定義に基づく行動者率は、文化施設の利用実態を住民の生活行動から捉える指標であり、「博物館・美術館の供給と利用」など施設側の統計を読者行動の面から補完する。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "自分の地域では演劇や舞踊を実際に見に行く人がどれくらいいるのか。",
        "targetReaderOrDecision": "文化活動への住民参加の実態を知りたい読者や文化政策担当者。"
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
