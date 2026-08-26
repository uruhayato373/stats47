import type { ThemeCatalog } from "./types";

export const REAL_INCOME_CATALOG: ThemeCatalog = {
  "key": "real-income",
  "title": "実質収入・購買力",
  "description": "都道府県別の名目収入を消費者物価地域差指数で補正し、実質的な購買力を比較。可処分所得・県民所得・家賃控除後手残りで「本当に豊かな県」を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "actual-income-worker-households-per-month",
      "shortLabel": "実収入",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "県民所得/人",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-income-per-household",
      "shortLabel": "世帯年収",
      "role": "context"
    },
    {
      "rankingKey": "real-disposable-income",
      "shortLabel": "実質可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "disposable-income-after-rent",
      "shortLabel": "家賃控除後手残り",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "CPI総合",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "CPI(家賃除く)",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "CPI(住居)",
      "role": "context"
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
      "role": "context"
    },
  ],
  "charts": [
{
      "componentKey": "real-income-cpi-breakdown",
      "componentType": "line-chart",
      "title": "消費者物価地域差指数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04414"
          },
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04417"
          },
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L04416"
          }
        ],
        "labels": [
          "総合",
          "住居",
          "食料"
        ],
        "seriesColors": [
          "neutral",
          "danger",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "consumer-price-difference-index-overall",
        "consumer-price-difference-index-housing",
        "consumer-price-difference-index-food"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "物価・家賃",
      "sortOrder": 0
    },
{
      "componentKey": "theme-real-income-actual-vs-disposable",
      "componentType": "line-chart",
      "title": "勤労者世帯の実収入の推移（全国平均）",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010212",
            "cdCat01": "#L01201"
          }
        ],
        "labels": [
          "実収入（月額）"
        ],
        "seriesColors": [
          "population"
        ]
      },
      "relatedRankingKeys": [
        "actual-income-worker-households-per-month"
      ],
      "sourceName": "総務省 家計調査",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 110
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
      key: "worker-household-income-flow",
      lensKey: "outcomes",
      title: "勤労者世帯の実収入と可処分所得",
      question: "税・社会保険料などの控除前後で、勤労者世帯の月収は地域ごとにどう異なるか。",
      summary:
        "二人以上の勤労者世帯について、月額の実収入と、そこから非消費支出を差し引いた可処分所得を比較する。都道府県の値は県全体ではなく県庁所在市の調査結果であり、単身世帯や勤労者以外の世帯を含まない。",
      sourceKeys: ["stat-family-income-expenditure-survey-2024"],
      relatedRankingKeys: [
        "actual-income-worker-households-per-month",
        "disposable-income-worker-households",
      ],
      relatedChartKeys: ["theme-real-income-actual-vs-disposable"],
      relatedThemeKeys: ["local-economy", "labor-wages"],
    },
    {
      key: "price-and-rent-adjusted-purchasing-power",
      lensKey: "equity",
      title: "物価・家賃補正後の購買力",
      question: "物価や家賃を織り込むと、可処分所得の地域間の相対的な位置はどう変わるか。",
      summary:
        "県庁所在市の二人以上の勤労者世帯の所得と、都道府県単位の物価指数を組み合わせた参考値として読む。物価地域差指数は各年の全国平均を100とする地域間比較で時系列の物価上昇率ではなく、家賃控除は年間の平均支出を月額換算したもので市場家賃や全世帯の負担を示さない。",
      sourceKeys: [
        "stat-family-income-expenditure-survey-2024",
        "stat-retail-price-survey-structural",
      ],
      relatedRankingKeys: [
        "real-disposable-income",
        "disposable-income-after-rent",
        "consumer-price-difference-index-overall",
      ],
      relatedChartKeys: ["real-income-cpi-breakdown"],
      relatedThemeKeys: ["consumer-prices", "living-housing"],
    },
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
