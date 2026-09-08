import type { ThemeCatalog } from "./types";

export const REAL_INCOME_CATALOG: ThemeCatalog = {
  "key": "real-income",
  "title": "実質収入・購買力",
  "description": "勤労者世帯の実収入から控除後・物価補正後の購買力を、対象世帯を揃えて比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "可処分所得は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "actual-income-worker-households-per-month",
      "shortLabel": "実収入（勤労者世帯・1世帯当たり月額）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "実収入は「控除前後の月収」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "県民所得/人",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "個人当たりの地域所得は家計の月収とは母集団が違い同じカードへ置かない。 主表示は「地域経済」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "annual-income-per-household",
      "shortLabel": "年間収入（1世帯当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "世帯年収は対象範囲・構造の関連指標として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "real-disposable-income",
      "shortLabel": "実質可処分所得",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "実質可処分所得は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "disposable-income-after-rent",
      "shortLabel": "家賃差引後の参考月額",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "家賃控除後手残りは「家賃を差し引いた手残り」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "CPI総合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "CPI総合は「物価補正後の購買力」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "CPI(家賃除く)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "CPI(家賃除く)は「物価補正後の購買力」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "CPI(住居)",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "CPI(住居)は「物価条件を詳しく見る」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "private-rental-housing-rent-per-3-3m2",
      "shortLabel": "家賃/3.3m²",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "家賃/3.3m²は「家賃を差し引いた手残り」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "private-rent-consumption-expenditure",
      "shortLabel": "家賃支出",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
        "surveyedAt": "2026-09-08",
        "rationale": "家賃支出は「家賃を差し引いた手残り」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "消費者物価地域差指数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "消費者物価地域差指数は「物価条件を詳しく見る」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "real-income-cpi-breakdown",
      "componentType": "line-chart",
      "title": "消費者物価地域差指数（総合）の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "consumer-price-difference-index-overall",
            "label": "CPI総合",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "consumer-price-difference-index-overall"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "annotation": "全国を100とする同年の地域差です。前年比の物価上昇率ではありません。",
      "section": "prices"
    },
    {
      "componentKey": "real-income-cpi-breakdown-expenses",
      "componentType": "line-chart",
      "title": "住居・食料の物価地域差指数の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "consumer-price-difference-index-housing",
            "label": "CPI(住居)",
            "colorRole": "series-1"
          },
          {
            "metricKey": "consumer-price-difference-index-food",
            "label": "消費者物価地域差指数",
            "colorRole": "series-2"
          }
        ]
      },
      "relatedRankingKeys": [
        "consumer-price-difference-index-housing",
        "consumer-price-difference-index-food"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 20,
      "annotation": "現在配信している2024年の費目別比較です。",
      "section": "prices"
    },
    {
      "componentKey": "theme-real-income-actual-vs-disposable",
      "componentType": "line-chart",
      "title": "実収入の比較（勤労者世帯・1世帯当たり月額）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "actual-income-worker-households-per-month",
            "label": "実収入（勤労者世帯・1世帯当たり月額）"
          }
        ],
        "labels": [
          "実収入（勤労者世帯・1世帯当たり月額）"
        ],
        "seriesColors": [
          "population"
        ]
      },
      "relatedRankingKeys": [
        "actual-income-worker-households-per-month"
      ],
      "sourceName": "総務省 家計調査",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "household-income",
      "sortOrder": 30,
      "annotation": "県庁所在市等の二人以上の勤労者世帯の平均です。県全体・単身世帯の平均とは異なります。"
    }
  ],
  "metricGroups": [
    {
      "key": "household-income-1",
      "title": "実収入（勤労者世帯・1世帯当たり月額）",
      "rankingKeys": [
        "actual-income-worker-households-per-month"
      ],
      "defaultCheckedKeys": [
        "actual-income-worker-households-per-month"
      ]
    },
    {
      "key": "household-income-2",
      "title": "可処分所得",
      "rankingKeys": [
        "disposable-income-worker-households"
      ],
      "defaultCheckedKeys": [
        "disposable-income-worker-households"
      ]
    },
    {
      "key": "purchasing-power",
      "title": "物価補正後の購買力",
      "rankingKeys": [
        "real-disposable-income"
      ],
      "defaultCheckedKeys": [
        "real-disposable-income"
      ]
    },
    {
      "key": "after-rent",
      "title": "家賃を差し引いた手残り",
      "rankingKeys": [
        "disposable-income-after-rent"
      ],
      "defaultCheckedKeys": [
        "disposable-income-after-rent"
      ]
    }
  ],
  "evidenceTopics": [
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
      "relatedChartKeys": [
        "theme-real-income-actual-vs-disposable"
      ],
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
  ],
  "sections": [
    {
      "key": "household-income",
      "title": "控除前後の月収",
      "description": "県庁所在市の二人以上の勤労者世帯の月額を比較します。県全体や単身世帯の平均ではありません。実収入と可処分所得で表示単位・収録期間が異なる場合は、それぞれの表記を確認してください。",
      "metricGroupKeys": [
        "household-income-1",
        "household-income-2"
      ],
      "chartKeys": [
        "theme-real-income-actual-vs-disposable"
      ]
    },
    {
      "key": "purchasing-power",
      "title": "物価補正後の購買力",
      "description": "可処分所得を地域の物価指数で補正した参考値です。個々の世帯の購買力を直接表すものではありません。",
      "metricGroupKeys": [
        "purchasing-power"
      ],
      "chartKeys": []
    },
    {
      "key": "after-rent",
      "title": "家賃を差し引いた手残り",
      "description": "勤労者世帯の可処分所得から、二人以上の全世帯の年間家賃支出を12で割って差し引いた参考計算です。母集団が完全には一致せず、実際の平均的な手残りを示すものではありません。県庁所在市の市場家賃は別の関連指標です。",
      "metricGroupKeys": [
        "after-rent"
      ],
      "chartKeys": []
    },
    {
      "key": "prices",
      "title": "物価条件を詳しく見る",
      "description": "物価の総合指数は長期推移、費目別は収録年の比較として読みます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "real-income-cpi-breakdown",
        "real-income-cpi-breakdown-expenses"
      ]
    }
  ]
};
