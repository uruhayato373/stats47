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
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "空き家率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "owner-occupied-housing-ratio",
      "shortLabel": "持ち家率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "持ち家率は「住宅ストックは余っているか」を読むため主要画面へ配置する。"
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
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "世帯数は「住む世帯はどう変わるか」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "nuclear-family-households-ratio",
      "shortLabel": "核家族世帯率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "核家族世帯率は「住む世帯はどう変わるか」を読むため主要画面へ配置する。"
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
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-08",
        "rationale": "DID面積1km²を基準にした人口集中地区人口密度として比較する。関連指標の索引で補足する。"
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
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "単独世帯割合は「住む世帯はどう変わるか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "household-ratio-above-minimum-housing-area",
      "shortLabel": "最低居住面積水準以上の世帯割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/k-sugata/pdf/shiki.pdf",
        "surveyedAt": "2026-09-08",
        "rationale": "持ち家/借家の平均床面積を、世帯の住居条件という問いへ接続する。"
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
