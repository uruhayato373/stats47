import type { ThemeCatalog } from "./types";

export const LIVING_HOUSING_CATALOG: ThemeCatalog = {
  "key": "living-housing",
  "title": "暮らし・住まい",
  "description": "住宅ストックの余り方・所有形態・住戸の広さと、住む世帯の形を比較する。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "vacant-housing-ratio",
      "shortLabel": "空き家率",
      "role": "primary",
      "selection": {
        "proposedBy": "令和6年版高齢社会白書 第1章第2節4「生活環境」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_2_4.html",
        "surveyedAt": "2026-09-16",
        "rationale": "内閣府の高齢社会白書は、居住者が長期不在の「使用目的のない空き家」がこの20年で約1.9倍に増えたことを住宅・土地統計調査の数値で示し、高齢化に伴う住まいの承継が進まない実態を政策課題として位置付けている。この白書の記述は、空き家比率が単なる余剰住宅の指標ではなく、世帯の高齢化・継承の停滞を映す指標であることを裏付けており、テーマ「住宅ストックは余っているか」の中心的な問いに直接対応する。",
        "adoptionCriteria": ["representativeness", "readerValue"],
        "readerQuestion": "自分の住む都道府県では、使われていない空き家がどれくらいの割合で増えているか。",
        "targetReaderOrDecision": "地域の空き家対策や住宅承継の必要性を判断したい自治体職員・住民"
      }
    },
    {
      "rankingKey": "owner-occupied-housing-ratio",
      "shortLabel": "持ち家率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版高齢社会白書 第1章第2節4「生活環境」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_2_4.html",
        "surveyedAt": "2026-09-16",
        "rationale": "高齢社会白書は65歳以上の者の住宅所有状況として持家率が8割を超えることを示し、高齢期の住まいの安定性を測る基礎データとして持ち家比率を扱っている。この記述は、持ち家率が世帯の資産・居住継続の安定度を表す指標であることを裏付け、空き家比率と対にして地域差を比較する意義を補強する。",
        "adoptionCriteria": ["complementarity", "dataQuality"],
        "readerQuestion": "自分の都道府県の持ち家率は全国平均や過去と比べて高いか低いか。",
        "targetReaderOrDecision": "住宅政策の地域比較を行う自治体職員・研究者"
      }
    },
    {
      "rankingKey": "floor-area-per-dwelling-owner",
      "shortLabel": "持ち家延べ面積（1住宅当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-08",
        "rationale": "1住宅当たりを基準にした持ち家住宅の延べ面積として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "floor-area-per-dwelling-rented",
      "shortLabel": "借家延べ面積（1住宅当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-08",
        "rationale": "1住宅当たりを基準にした借家住宅の延べ面積として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "households",
      "shortLabel": "世帯数",
      "role": "context",
      "selection": {
        "proposedBy": "令和5年版高齢社会白書 第1章第1節3「家族と世帯」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2023/html/zenbun/s1_1_3.html",
        "surveyedAt": "2026-09-16",
        "rationale": "高齢社会白書は、高齢者のいる世帯数を全世帯数（5,191万4千世帯）と対比して示しており、世帯数そのものが世帯構成の変化を測る基準単位として用いられている。この記述は、世帯数がテーマ「住む世帯はどう変わるか」における分母として不可欠であり、他の世帯構成比指標（核家族世帯率など）と組み合わせて初めて地域差や時系列変化を解釈できることを裏付ける。",
        "adoptionCriteria": ["comparability", "complementarity"],
        "readerQuestion": "自分の都道府県の総世帯数はどのように推移してきたか。",
        "targetReaderOrDecision": "住宅需要や世帯構成の変化を把握したい自治体の住宅政策担当者"
      }
    },
    {
      "rankingKey": "nuclear-family-households-ratio",
      "shortLabel": "核家族世帯率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和5年版高齢社会白書 第1章第1節3「家族と世帯」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2023/html/zenbun/s1_1_3.html",
        "surveyedAt": "2026-09-16",
        "rationale": "高齢社会白書は、昭和55年に半数を占めていた三世代世帯が令和3年には夫婦のみ世帯・単独世帯へと構成割合が入れ替わったことを示しており、核家族世帯（夫婦のみ・夫婦と子・ひとり親と子）の増加傾向を裏付ける一次資料となっている。この記述は、核家族世帯割合が単身化と並んで世帯構成の変化を捉える鍵指標であることを示し、テーマの章立て「世帯構成の変化」に直接対応する。",
        "adoptionCriteria": ["representativeness", "complementarity"],
        "readerQuestion": "自分の都道府県で核家族世帯の割合はどのように変化してきたか。",
        "targetReaderOrDecision": "世帯構成の変化を踏まえて住宅・福祉施策を検討する自治体職員"
      }
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦世帯",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢世帯の専用比較は少子高齢化へ集約する。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯（一般世帯に対して）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢単身世帯の分母を含む解説は少子高齢化へ集約する。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "population-density-per-km2-inhabitable-area",
      "shortLabel": "人口密度（可住地1km²当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "可住地1km²を基準にした可住地面積１km2当たり人口密度として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "habitable-area-ratio",
      "shortLabel": "可住地面積割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "可住地面積割合は「人口密度を背景に読む」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "densely-inhabited-district-population-density",
      "shortLabel": "DID人口密度（DID面積1km²当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "埼玉県 統計FAQ「人口集中地区（DID）とは何ですか」（埼玉県企画財政部統計課）",
        "sourceUrl": "https://www.pref.saitama.lg.jp/a0206/toukeifaq/q3-1.html",
        "surveyedAt": "2026-09-16",
        "rationale": "この解説は、人口集中地区（DID）が「人口密度4,000人/km2以上」という基準で市区町村内に設定される統計上の地域単位であることを示しており、DID人口密度指標はこの基準がどの程度の実際の集積度として実現しているかを都道府県間で比較できる代表的な尺度になる。住宅ストックの余り方や住戸の広さを論じる際、人口がどれだけ密に集まっている地域に住宅が立地しているかという前提条件を示す点で、都市の人口集積と計画上の区域の章の問いに直接つながる。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の住む都道府県の人口集中地区はどれくらい人が密集しているのか。",
        "targetReaderOrDecision": "都市計画やコンパクトシティ政策を検討する自治体職員・住民"
      }
    },
    {
      "rankingKey": "ratio-never-married-15-plus",
      "shortLabel": "未婚率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "未婚率と高齢夫婦世帯割合を一緒に見せても住宅状況への答えにならない。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "marriages",
      "shortLabel": "婚姻件数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "婚姻動向は出生・家族形成の補足であり住宅ストックの主問から外す。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "divorces",
      "shortLabel": "離婚件数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-08",
        "rationale": "離婚件数は住宅状況を直接説明しない。 主表示は「少子高齢化」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "single-person-household-ratio",
      "shortLabel": "単独世帯割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "鹿児島県 令和2年国勢調査結果（人口等基本集計結果：世帯の構成）（鹿児島県企画部統計課）",
        "sourceUrl": "https://www.pref.kagoshima.jp/ac09/tokei/bunya/kokutyo/r2kokutyo/r2jinnkoutoukihonnsyuukeisetainokousei.html",
        "surveyedAt": "2026-09-16",
        "rationale": "この結果は、令和2年国勢調査において単独世帯（1人世帯）が一般世帯の中で最も多い世帯類型になったことを都道府県単位で示しており、単身化と一人暮らしの進行度合いを地域間で比較する際の直接的な代表指標となる。住む世帯の形がどう変わるかというテーマの問いに対し、世帯構成の変化を定量的に裏付ける基礎データとして機能する。",
        "adoptionCriteria": ["representativeness", "readerValue"],
        "readerQuestion": "自分の住む地域では一人暮らし世帯がどれくらいの割合を占めているのか。",
        "targetReaderOrDecision": "単身世帯向け住宅政策や見守りサービスを検討する自治体・事業者"
      }
    },
    {
      "rankingKey": "household-ratio-above-minimum-housing-area",
      "shortLabel": "最低居住面積水準以上の世帯割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "徳島県庁コールセンターすだちくんコール「誘導居住面積水準、最低居住面積水準とは何ですか。」（徳島県）",
        "sourceUrl": "https://www.pref.tokushima.lg.jp/FAQ/docs/00018685/",
        "surveyedAt": "2026-09-16",
        "rationale": "この解説は、最低居住面積水準が国の住生活基本計画に基づき世帯人数ごとに定められた「必要不可欠な住宅の広さ」の政策的しきい値であることを示している。この水準以上の世帯割合は、住戸の広さが最低限の生活水準を満たしているかを都道府県間で比較できる指標であり、どれくらいの広さに住むかというテーマの章の問いに直接応える。",
        "adoptionCriteria": ["representativeness", "comparability", "dataQuality"],
        "readerQuestion": "自分の地域では最低限必要とされる広さに満たない世帯がどれくらいいるのか。",
        "targetReaderOrDecision": "住宅の質・広さに関する政策目標の達成度を確認したい行政担当者"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "vacancy-ownership-rate-trend",
      "componentType": "line-chart",
      "title": "空き家率と持ち家率の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "vacant-housing-ratio"
          },
          {
            "metricKey": "owner-occupied-housing-ratio"
          }
        ],
        "labels": [
          "空き家率",
          "持ち家率"
        ],
        "seriesColors": [
          "danger",
          "population"
        ]
      },
      "relatedRankingKeys": [
        "vacant-housing-ratio",
        "owner-occupied-housing-ratio"
      ],
      "sourceName": "住宅・土地統計調査",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "housing-stock",
      "sortOrder": 10
    },
    {
      "componentKey": "md-living-housing-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "空き家率と持ち家率は対象となる住宅が異なります。両者を足して住宅全体の内訳にはできません。\n\n持ち家と借家の平均面積に加え、世帯人数に応じた最低居住面積水準を満たす世帯の割合を確認します。\n\n単独世帯と核家族世帯は、それぞれの対象年を確認します。単年の値を過去まで延長して読みません。"
      },
      "sourceName": "国土交通白書 2025 / 住宅・土地統計調査 (総務省統計局) / 厚生労働白書 (令和7年版) / 空家等対策の推進に関する特別措置法 (国土交通省) / 立地適正化計画 (国土交通省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 20
    },
    {
      "componentKey": "md-living-housing-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 住宅ストックは余っているかを見るときの注意は？\n\n空き家率と持ち家率は対象となる住宅が異なります。両者を足して住宅全体の内訳にはできません。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n住まいの広さと世帯の形を、地域人口の背景と合わせて読みます。"
      },
      "sourceName": "国土交通白書 2025 / 住宅・土地統計調査 (総務省統計局) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 立地適正化計画 (国土交通省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    },
    {
      "componentKey": "lh-dwelling-floor-area-trend",
      "componentType": "line-chart",
      "title": "持ち家・借家の延べ面積（1住宅当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "floor-area-per-dwelling-owner",
            "label": "持ち家延べ面積（1住宅当たり）"
          },
          {
            "metricKey": "floor-area-per-dwelling-rented",
            "label": "借家延べ面積（1住宅当たり）"
          }
        ],
        "labels": [
          "持ち家延べ面積（1住宅当たり）",
          "借家延べ面積（1住宅当たり）"
        ],
        "seriesColors": [
          "series-6",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "floor-area-per-dwelling-owner",
        "floor-area-per-dwelling-rented"
      ],
      "sourceName": "住宅・土地統計調査",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "dwelling-space",
      "sortOrder": 40,
      "annotation": "住宅・土地統計調査の1住宅当たり延べ面積です。住宅全体の延べ面積を合計した値ではありません。"
    },
    {
      "componentKey": "lh-household-structure-trend",
      "componentType": "line-chart",
      "title": "核家族世帯割合の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "nuclear-family-households-ratio",
            "label": "核家族世帯率",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "nuclear-family-households-ratio"
      ],
      "sourceName": "総務省「国勢調査」",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 50,
      "section": "households"
    },
    {
      "componentKey": "lh-household-structure-trend-single",
      "componentType": "line-chart",
      "title": "単独世帯割合の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "single-person-household-ratio",
            "label": "単独世帯割合",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "single-person-household-ratio"
      ],
      "sourceName": "総務省「国勢調査」",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 60,
      "annotation": "単独世帯は現在配信している2020年の値です。",
      "section": "households"
    }
  ],
  "evidenceTopics": [
    {
      "key": "housing-stock-and-aging",
      "lensKey": "sustainability",
      "title": "高齢期の住まいと空き家ストック",
      "question": "持ち家率と空き家率には、高齢化に伴う住まいの継承・利用の地域差がどう表れるか",
      "summary": "白書は65歳以上の持ち家と使用目的のない空き家を扱います。ランキングは全世帯の持ち家率と、賃貸・売却用や二次的住宅も含む空き家率であり、対象を同一視しません。",
      "sourceKeys": [
        "cao-aging-whitepaper-2025-housing",
        "stat-housing-land-survey-2023"
      ],
      "relatedRankingKeys": [
        "owner-occupied-housing-ratio",
        "vacant-housing-ratio"
      ],
      "relatedChartKeys": [
        "vacancy-ownership-rate-trend"
      ],
      "relatedThemeKeys": [
        "aging-society"
      ]
    },
    {
      "key": "tenure-space-gap",
      "lensKey": "equity",
      "title": "持ち家・借家の居住空間",
      "question": "持ち家と借家の1住宅当たり延べ面積には、どのような地域差があるか",
      "summary": "延べ面積は住宅内の広さを示す平均値です。住宅価格や家賃、世帯人員、建物の品質は示さないため、取得・居住の負担とは分けて読みます。",
      "sourceKeys": [
        "stat-housing-land-survey-2023"
      ],
      "relatedRankingKeys": [
        "floor-area-per-dwelling-owner",
        "floor-area-per-dwelling-rented"
      ],
      "relatedChartKeys": [
        "lh-dwelling-floor-area-trend"
      ],
      "relatedThemeKeys": [
        "real-income"
      ]
    }
  ],
  "keywords": [
    "空き家",
    "持ち家",
    "人口密度",
    "世帯構造",
    "未婚率",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "housing-stock",
      "title": "住宅ストックは余っているか",
      "description": "空き家率と持ち家率は対象となる住宅が異なります。両者を足して住宅全体の内訳にはできません。",
      "metricGroupKeys": [
        "housing-stock"
      ],
      "chartKeys": [
        "vacancy-ownership-rate-trend"
      ]
    },
    {
      "key": "dwelling-space",
      "title": "どれくらいの広さに住むか",
      "description": "持ち家と借家の平均面積に加え、世帯人数に応じた最低居住面積水準を満たす世帯の割合を確認します。",
      "metricGroupKeys": [
        "dwelling-space-1",
        "dwelling-space-2"
      ],
      "chartKeys": [
        "lh-dwelling-floor-area-trend"
      ]
    },
    {
      "key": "households",
      "title": "住む世帯はどう変わるか",
      "description": "単独世帯と核家族世帯は、それぞれの対象年を確認します。単年の値を過去まで延長して読みません。",
      "metricGroupKeys": [
        "households"
      ],
      "chartKeys": [
        "lh-household-structure-trend",
        "lh-household-structure-trend-single"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "住まいの広さと世帯の形を、地域人口の背景と合わせて読みます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-living-housing-discussion",
        "md-living-housing-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "housing-stock",
      "title": "住宅ストックは余っているか",
      "rankingKeys": [
        "vacant-housing-ratio",
        "owner-occupied-housing-ratio"
      ],
      "defaultCheckedKeys": [
        "vacant-housing-ratio",
        "owner-occupied-housing-ratio"
      ]
    },
    {
      "key": "dwelling-space-1",
      "title": "持ち家延べ面積・借家延べ面積",
      "rankingKeys": [
        "floor-area-per-dwelling-owner",
        "floor-area-per-dwelling-rented"
      ],
      "defaultCheckedKeys": [
        "floor-area-per-dwelling-owner",
        "floor-area-per-dwelling-rented"
      ]
    },
    {
      "key": "dwelling-space-2",
      "title": "最低居住面積水準以上の世帯割合",
      "rankingKeys": [
        "household-ratio-above-minimum-housing-area"
      ],
      "defaultCheckedKeys": [
        "household-ratio-above-minimum-housing-area"
      ]
    },
    {
      "key": "households",
      "title": "住む世帯はどう変わるか",
      "rankingKeys": [
        "single-person-household-ratio",
        "nuclear-family-households-ratio"
      ],
      "defaultCheckedKeys": [
        "single-person-household-ratio",
        "nuclear-family-households-ratio"
      ]
    }
  ]
};
