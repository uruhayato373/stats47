import type { ThemeCatalog } from "./types";

export const LIVING_HOUSING_CATALOG: ThemeCatalog = {
  "key": "living-housing",
  "title": "暮らし・住まい",
  "description": "都道府県別の空き家比率・持ち家比率・世帯構造・人口密度をランキングとチャートで比較。暮らしの地域差を47都道府県のデータで確認できます。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "vacant-housing-ratio",
      "shortLabel": "空き家率",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2024・令和5年住宅・土地統計調査",
        "sourceUrl": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "賃貸用・売却用・二次的住宅を含む空き家全体の割合です。管理不全の空き家だけの割合ではありません。 概況カード・地域分布・比較表で利用状況と広さを読む。"
      }
    },
    {
      "rankingKey": "owner-occupied-housing-ratio",
      "shortLabel": "持ち家率",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2024・令和5年住宅・土地統計調査",
        "sourceUrl": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "高齢者世帯に限定しない持ち家率です。高いことがそのまま住宅取得のしやすさを意味するわけではありません。 概況カード・地域分布・比較表で利用状況と広さを読む。"
      }
    },
    {
      "rankingKey": "floor-area-per-dwelling-owner",
      "shortLabel": "持ち家の広さ",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2024・令和5年住宅・土地統計調査",
        "sourceUrl": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "持ち家1住宅当たりの延べ面積です。1人当たりの広さや住宅価格ではありません。 概況カード・地域分布・比較表で利用状況と広さを読む。"
      }
    },
    {
      "rankingKey": "floor-area-per-dwelling-rented",
      "shortLabel": "借家の広さ",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2024・令和5年住宅・土地統計調査",
        "sourceUrl": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
        "surveyedAt": "2026-09-09",
        "rationale": "借家1住宅当たりの延べ面積です。家賃や住居費の負担、建物の品質は示しません。 概況カード・地域分布・比較表で利用状況と広さを読む。"
      }
    },
    {
      "rankingKey": "households",
      "shortLabel": "世帯数",
      "role": "context"
    },
    {
      "rankingKey": "nuclear-family-households-ratio",
      "shortLabel": "核家族世帯率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書・令和2年国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_4.html",
        "surveyedAt": "2026-09-09",
        "rationale": "夫婦のみ・夫婦と子・ひとり親と子の世帯を含みます。単独世帯との2区分だけで全世帯にはなりません。 世帯構成の背景を比較表で確認する。"
      }
    },
    {
      "rankingKey": "elderly-couple-only-household-ratio",
      "shortLabel": "高齢夫婦のみ世帯率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書・令和2年国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_4.html",
        "surveyedAt": "2026-09-09",
        "rationale": "夫65歳以上・妻60歳以上の夫婦のみの世帯が、一般世帯に占める割合です。白書の「65歳以上の世帯員がいる世帯」と対象が異なります。 世帯構成の背景を比較表で確認する。"
      }
    },
    {
      "rankingKey": "single-person-household-old-population-ratio",
      "shortLabel": "高齢単独世帯率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書・令和2年国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_4.html",
        "surveyedAt": "2026-09-09",
        "rationale": "一般世帯に占める65歳以上の1人世帯の割合です。65歳以上の人口を分母にした割合ではありません。 世帯構成の背景を比較表で確認する。"
      }
    },
    {
      "rankingKey": "population-density-per-km2-inhabitable-area",
      "shortLabel": "人口密度",
      "role": "context"
    },
    {
      "rankingKey": "habitable-area-ratio",
      "shortLabel": "可住地面積割合",
      "role": "context"
    },
    {
      "rankingKey": "densely-inhabited-district-population-density",
      "shortLabel": "DID人口密度",
      "role": "context"
    },
    {
      "rankingKey": "ratio-never-married-15-plus",
      "shortLabel": "未婚率",
      "role": "context"
    },
    {
      "rankingKey": "marriages",
      "shortLabel": "婚姻件数",
      "role": "context"
    },
    {
      "rankingKey": "divorces",
      "shortLabel": "離婚件数",
      "role": "context"
    },
    {
      "rankingKey": "single-person-household-ratio",
      "shortLabel": "単独世帯割合",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和7年版高齢社会白書・令和2年国勢調査",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_4.html",
        "surveyedAt": "2026-09-09",
        "rationale": "一般世帯に占める1人世帯の割合です。人口に占める1人暮らしの割合ではありません。 世帯構成の背景を比較表で確認する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "vacancy-ownership-rate-trend",
      "componentType": "line-chart",
      "title": "空き家率はどう変わったか",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "vacant-housing-ratio",
            "label": "空き家率",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "vacant-housing-ratio"
      ],
      "sourceName": "住宅・土地統計調査",
      "sourceLink": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "住宅",
      "sortOrder": 0,
      "annotation": "空き家全体の割合。賃貸・売却用や二次的住宅を含み、管理不全の空き家率ではありません。"
    },
    {
      "componentKey": "lh-ownership-rate-trend",
      "componentType": "line-chart",
      "title": "持ち家率はどう変わったか",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "owner-occupied-housing-ratio",
            "label": "持ち家率",
            "colorRole": "series-2"
          }
        ]
      },
      "relatedRankingKeys": [
        "owner-occupied-housing-ratio"
      ],
      "sourceName": "住宅・土地統計調査",
      "sourceLink": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "住宅",
      "sortOrder": 10,
      "annotation": "空き家率とは分母が異なり、2つの割合を足しても住宅の構成比にはなりません。"
    },
    {
      "componentKey": "lh-dwelling-floor-area-trend",
      "componentType": "line-chart",
      "title": "借家の延べ面積の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "floor-area-per-dwelling-rented"
          }
        ]
      },
      "relatedRankingKeys": [
        "floor-area-per-dwelling-rented"
      ],
      "sourceName": "住宅・土地統計調査",
      "sourceLink": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20,
      "annotation": "住宅・土地統計調査の収録年を表示。持ち家の広さは2時点のみのため比較表で確認できます。"
    },
    {
      "componentKey": "lh-older-households-trend",
      "componentType": "line-chart",
      "title": "高齢の単独・夫婦世帯は増えているか",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "single-person-household-old-population-ratio",
            "label": "高齢単独世帯率",
            "colorRole": "series-3"
          },
          {
            "metricKey": "elderly-couple-only-household-ratio",
            "label": "高齢夫婦のみ世帯率",
            "colorRole": "series-4"
          }
        ]
      },
      "relatedRankingKeys": [
        "single-person-household-old-population-ratio",
        "elderly-couple-only-household-ratio"
      ],
      "sourceName": "国勢調査（社会・人口統計体系）",
      "sourceLink": "https://www.stat.go.jp/data/kokusei/2020/kekka.html",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "住宅",
      "sortOrder": 30,
      "annotation": "いずれも分母は一般世帯。単独は65歳以上、夫婦のみは夫65歳以上・妻60歳以上で、年齢条件が異なります。"
    },
    {
      "componentKey": "md-living-housing-discussion",
      "componentType": "markdown-section",
      "title": "住宅と世帯を読み合わせる",
      "componentProps": {
        "markdown": "### 空き家の多さと住宅の使われ方\n国土交通白書2024は、人口減少に伴う地域の住宅需要と空き家の増加を論点にしています。まず地図で地域差を、推移で時間的な変化を確認します。空き家全体には賃貸・売却用や二次的住宅も含まれるため、その割合だけで管理状態を判断しません。\n\n### 持ち家・借家の広さ\n住宅・土地統計調査は所有の関係と住宅の規模を別々に集計しています。持ち家率と延べ面積を読み合わせると、住まいの形の違いを比較できます。ただし、面積の差から住宅価格や住居費の負担は判断できません。\n\n### 住まいを支える世帯の構成\n高齢社会白書は高齢期の住まいを取り上げています。このページでは国勢調査に基づく単独・高齢世帯の指標を併せて比較します。単独世帯と核家族世帯の割合は比較表で、複数年のデータがある高齢世帯は折れ線で確認できます。住宅統計とは調査年や世帯の対象が異なるため、因果関係を直接示すものではありません。",
        "sources": [
          {
            "label": "国土交通白書2024：高齢社会と地域活力の維持",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/r05/hakusho/r06/html/n1113000.html"
          },
          {
            "label": "令和5年住宅・土地統計調査：調査の結果",
            "url": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm"
          },
          {
            "label": "令和7年版高齢社会白書：生活環境",
            "url": "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_2_4.html"
          },
          {
            "label": "令和2年国勢調査：調査の結果",
            "url": "https://www.stat.go.jp/data/kokusei/2020/kekka.html"
          }
        ]
      },
      "sourceName": "住宅・土地統計調査・国勢調査・白書",
      "sourceLink": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 100
    },
    {
      "componentKey": "md-living-housing-faq",
      "componentType": "markdown-section",
      "title": "比較するときのよくある疑問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 都道府県の中央値は全国平均ですか？\n違います。各都道府県の値を小さい順に並べた中央の値です。住宅数や世帯数で重み付けした日本全体の割合・平均ではありません。\n\n### Q2: 空き家率と持ち家率を足すと100％になりますか？\nなりません。空き家率と持ち家率は分母が異なる指標です。構成比として積み上げず、それぞれの分布と推移を確認してください。\n\n### Q3: 表の指標はすべて同じ年のデータですか？\n指標ごとの収録最新年を表示しているため、年が異なる場合があります。同じ指標の都道府県比較では年をそろえています。横断比較では各行の年次を確認してください。"
      },
      "sourceName": "住宅・土地統計調査・国勢調査・白書",
      "sourceLink": "https://www.stat.go.jp/data/jyutaku/2023/tyousake.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 110
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
        "vacancy-ownership-rate-trend",
        "lh-ownership-rate-trend"
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
  "overview": {
    "introduction": "住宅の利用状況・広さと、世帯構成を比較。",
    "headlineRankingKeys": [
      "vacant-housing-ratio",
      "owner-occupied-housing-ratio",
      "floor-area-per-dwelling-owner",
      "floor-area-per-dwelling-rented"
    ],
    "comparisonRankingKeys": [
      "vacant-housing-ratio",
      "owner-occupied-housing-ratio",
      "floor-area-per-dwelling-owner",
      "floor-area-per-dwelling-rented",
      "single-person-household-ratio",
      "nuclear-family-households-ratio",
      "elderly-couple-only-household-ratio",
      "single-person-household-old-population-ratio"
    ],
    "mapNotes": {
      "vacant-housing-ratio": "賃貸用・売却用・二次的住宅を含む空き家全体の割合です。管理不全の空き家だけの割合ではありません。",
      "owner-occupied-housing-ratio": "高齢者世帯に限定しない持ち家率です。高いことがそのまま住宅取得のしやすさを意味するわけではありません。",
      "floor-area-per-dwelling-owner": "持ち家1住宅当たりの延べ面積です。1人当たりの広さや住宅価格ではありません。",
      "floor-area-per-dwelling-rented": "借家1住宅当たりの延べ面積です。家賃や住居費の負担、建物の品質は示しません。",
      "single-person-household-ratio": "一般世帯に占める1人世帯の割合です。人口に占める1人暮らしの割合ではありません。",
      "nuclear-family-households-ratio": "夫婦のみ・夫婦と子・ひとり親と子の世帯を含みます。単独世帯との2区分だけで全世帯にはなりません。",
      "elderly-couple-only-household-ratio": "夫65歳以上・妻60歳以上の夫婦のみの世帯が、一般世帯に占める割合です。白書の「65歳以上の世帯員がいる世帯」と対象が異なります。",
      "single-person-household-old-population-ratio": "一般世帯に占める65歳以上の1人世帯の割合です。65歳以上の人口を分母にした割合ではありません。"
    }
  }
};
