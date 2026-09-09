import type { ThemeCatalog } from "./types";

export const REAL_INCOME_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "家計の収入と物価補正後の水準を比較。家計は県庁所在市の勤労者世帯です。",
    "headlineRankingKeys": [
      "disposable-income-worker-households",
      "real-disposable-income",
      "actual-income-worker-households-per-month",
      "consumer-price-difference-index-overall"
    ],
    "comparisonRankingKeys": [
      "disposable-income-worker-households",
      "actual-income-worker-households-per-month",
      "real-disposable-income",
      "consumer-price-difference-index-overall",
      "consumer-price-difference-index-overall-excl-rent",
      "consumer-price-difference-index-housing",
      "consumer-price-difference-index-food"
    ],
    "mapNotes": {
      "disposable-income-worker-households": "県庁所在市の二人以上・勤労者世帯の月額。県全体の平均ではありません。",
      "actual-income-worker-households-per-month": "県庁所在市の二人以上・勤労者世帯の税込月額。県全体の平均ではありません。",
      "real-disposable-income": "県庁所在市の所得を県単位の物価指数で補正した参考値。県全体の実質賃金ではありません。",
      "consumer-price-difference-index-overall": "各年の全国平均=100。前年からの物価上昇率ではありません。",
      "consumer-price-difference-index-overall-excl-rent": "家賃を除く物価の地域差。各年の全国平均=100。",
      "consumer-price-difference-index-housing": "住居費目の価格の地域差。家計の住居費負担割合ではありません。",
      "consumer-price-difference-index-food": "食料価格の地域差。食費支出額やエンゲル係数ではありません。"
    }
  },
  "key": "real-income",
  "title": "実質収入・購買力",
  "description": "都道府県別の名目収入を消費者物価地域差指数で補正し、実質的な購買力を比較。可処分所得・県民所得・家賃控除後手残りで「本当に豊かな県」を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「家計調査」",
        "sourceUrl": "https://www.stat.go.jp/data/kakei/index.html",
        "surveyedAt": "2026-09-09",
        "rationale": "税込実収入から税・社会保険料等を引いた月額を、物価補正の基礎として上部に置く。県庁所在市の二人以上勤労者世帯に限定する。"
      }
    },
    {
      "rankingKey": "actual-income-worker-households-per-month",
      "shortLabel": "実収入",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「家計調査」",
        "sourceUrl": "https://www.stat.go.jp/data/kakei/index.html",
        "surveyedAt": "2026-09-09",
        "rationale": "可処分所得の控除前の収入を並べ、税込収入と手取りに近い額を読み分ける。"
      }
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "県民所得/人",
      "role": "context"
    },
    {
      "rankingKey": "annual-income-per-household",
      "shortLabel": "世帯年収",
      "role": "context"
    },
    {
      "rankingKey": "real-disposable-income",
      "shortLabel": "実質可処分所得",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「小売物価統計調査（構造編）」",
        "sourceUrl": "https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "名目可処分所得÷全国=100の地域差指数×100という既存計算を、地域間購買力の参考値として示す。県庁所在市と県の粒度差を注記する。"
      }
    },
    {
      "rankingKey": "disposable-income-after-rent",
      "shortLabel": "家賃控除後手残り",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "CPI総合",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省「小売物価統計調査（構造編）」",
        "sourceUrl": "https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "物価補正の分母を併記し、所得が高い地域と価格水準が高い地域を区別する。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "CPI(家賃除く)",
      "role": "secondary",
      "selection": {
        "proposedBy": "総務省「小売物価統計調査（構造編）」",
        "sourceUrl": "https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "家賃を除いた補助比較で、総合指数と住居費目の関係を読む。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "CPI(住居)",
      "role": "secondary",
      "selection": {
        "proposedBy": "総務省「小売物価統計調査（構造編）」",
        "sourceUrl": "https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "生活コストの地域差の内訳を住居価格側から補足する。"
      }
    },
    {
      "rankingKey": "private-rental-housing-rent-per-3-3m2",
      "shortLabel": "家賃/3.3m²",
      "role": "context"
    },
    {
      "rankingKey": "private-rent-consumption-expenditure",
      "shortLabel": "家賃支出",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "消費者物価地域差指数",
      "role": "secondary",
      "selection": {
        "proposedBy": "総務省「小売物価統計調査（構造編）」",
        "sourceUrl": "https://www.stat.go.jp/data/kouri/kouzou/gaiyou.html",
        "surveyedAt": "2026-09-09",
        "rationale": "住居以外の生活コストとして食料の相対価格を補足する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "real-income-cpi-breakdown",
      "componentType": "line-chart",
      "title": "物価水準の相対的位置の推移（総合）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "consumer-price-difference-index-overall"
          }
        ]
      },
      "relatedRankingKeys": [
        "consumer-price-difference-index-overall"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "物価・家賃",
      "sortOrder": 0,
      "annotation": "各年の全国平均=100。時系列の物価上昇率ではありません。単年の費目別指数は比較表に表示します。"
    }
  ],
  // 指標カードの編成。円 (可処分所得) と 千円 (実収入・県民所得) は桁が 1000 倍違うので
  // 同じ軸に載せると片方が潰れる → 左右 Y 軸に分かれる
  metricGroups: [
    {
      key: "income-level",
      title: "収入の水準",
      rankingKeys: [
        "actual-income-worker-households-per-month",
        "disposable-income-worker-households",
        "per-capita-prefectural-income-h27",
      ],
      defaultCheckedKeys: [
        "actual-income-worker-households-per-month",
        "disposable-income-worker-households",
      ],
    },
    {
      key: "real-terms",
      title: "物価・家賃を織り込んだ手残り",
      // どちらも円なので単軸。名目 → 物価調整 → 家賃控除の並びで読ませる
      rankingKeys: ["real-disposable-income", "disposable-income-after-rent"],
      defaultCheckedKeys: ["real-disposable-income", "disposable-income-after-rent"],
    },
  ],
  evidenceTopics: [
    {
      "key": "worker-household-income-flow",
      "lensKey": "outcomes",
      "title": "勤労者世帯の実収入と可処分所得",
      "question": "税・社会保険料などの控除前後で、勤労者世帯の月収は地域ごとにどう異なるか。",
      "summary": "二人以上の勤労者世帯について、月額の実収入と、そこから非消費支出を差し引いた可処分所得を比較する。都道府県の値は県全体ではなく県庁所在市の調査結果であり、単身世帯や勤労者以外の世帯を含まない。",
      "sourceKeys": [
        "stat-family-income-expenditure-survey-2024"
      ],
      "relatedRankingKeys": [
        "actual-income-worker-households-per-month",
        "disposable-income-worker-households"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "local-economy",
        "labor-wages"
      ]
    },
    {
      "key": "price-and-rent-adjusted-purchasing-power",
      "lensKey": "equity",
      "title": "物価・家賃補正後の購買力",
      "question": "物価や家賃を織り込むと、可処分所得の地域間の相対的な位置はどう変わるか。",
      "summary": "県庁所在市の二人以上の勤労者世帯の所得と、都道府県単位の物価指数を組み合わせた参考値として読む。物価地域差指数は各年の全国平均を100とする地域間比較で時系列の物価上昇率ではなく、家賃控除は年間の平均支出を月額換算したもので市場家賃や全世帯の負担を示さない。",
      "sourceKeys": [
        "stat-family-income-expenditure-survey-2024",
        "stat-retail-price-survey-structural"
      ],
      "relatedRankingKeys": [
        "real-disposable-income",
        "disposable-income-after-rent",
        "consumer-price-difference-index-overall"
      ],
      "relatedChartKeys": [
        "real-income-cpi-breakdown"
      ],
      "relatedThemeKeys": [
        "consumer-prices",
        "living-housing"
      ]
    },
    {
      "key": "engel-coefficient-reading",
      "lensKey": "composition",
      "title": "エンゲル係数の読み方",
      "question": "食料費の割合が高い地域は、本当に生活が苦しいと言えるのか。",
      "summary": "エンゲル係数は消費支出に占める食料費の割合なので、分子の食料費が増えても分母の消費支出が減っても上がる。外食・調理食品への支出が多い地域や、高齢世帯の比率が高い地域でも高く出るため、単独では豊かさの指標にならない。県民所得や消費支出の水準と併せて読む。都道府県の値は県全体ではなく県庁所在市の二人以上世帯の調査結果である。",
      "sourceKeys": [
        "stat-family-income-expenditure-survey-2024"
      ],
      "relatedRankingKeys": [
        "engel-coefficient",
        "consumption-expenditure-multi-person-households-per-month",
        "per-capita-prefectural-income-h27"
      ],
      "relatedChartKeys": [
        "real-income-cpi-breakdown"
      ],
      "relatedThemeKeys": [
        "consumer-prices",
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "実質年収",
    "実質購買力",
    "物価補正",
    "可処分所得",
    "家賃控除",
    "手残り",
    "都道府県",
    "ランキング"
  ]
};
