import type { ThemeCatalog } from "./types";

export const LOCAL_ECONOMY_CATALOG: ThemeCatalog = {
  "key": "local-economy",
  "title": "地域経済",
  "description": "県民所得、納税者の所得、産業別就業者構成、農業産出額から、地域の所得形成と生産基盤を比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税対象所得（納税義務者1人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/D",
        "surveyedAt": "2026-09-08",
        "rationale": "納税義務者1人を基準にした課税対象所得として比較する。対象範囲を表示して主章に配置する。"
      }
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "1人当たり県民所得",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "1人当たり県民所得は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "minimum-wage-by-region",
      "shortLabel": "最低賃金",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "法定最低賃金は賃金テーマの主指標であり地域経済で重複掲載しない。 主表示は「労働・賃金」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "求人需給は雇用環境テーマへ集約する。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "失業は雇用環境テーマへ集約する。 主表示は「人材流動性・雇用環境」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "自治体の財政力と地域経済力を同一視しない。 主表示は「地方財政」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "employed-people-ratio-primary",
      "shortLabel": "第1次産業就業者比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "第1次産業就業者比率は「どの産業で働いているか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "employed-people-ratio-secondary",
      "shortLabel": "第2次産業就業者比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "第2次産業就業者比率は「どの産業で働いているか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "employed-people-ratio-tertiary",
      "shortLabel": "第3次産業就業者比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "第3次産業就業者比率は「どの産業で働いているか」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得（二人以上の世帯のうち勤労者世帯）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "勤労者世帯の家計収入は実質収入の主責務であり県民所得と別の母集団。 主表示は「実質収入・購買力」へ集約する。関連指標としての導線は保持する。"
      }
    },
    {
      "rankingKey": "number-of-establishments-economic-census-basic-survey",
      "shortLabel": "事業所数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "公開最新2014年のため現状把握の主画面へ昇格しない。歴史参考として保持し更新後に再判定。"
      }
    },
    {
      "rankingKey": "agricultural-output",
      "shortLabel": "農業産出額",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/gaiyou/",
        "surveyedAt": "2026-09-08",
        "rationale": "既存の産業別就業割合に生産側の見方を補い、農業の弱い地域経済構成を補完する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-industry-structure",
      "componentType": "donut-chart",
      "title": "産業別就業者構成比",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "employed-people-ratio-primary",
            "label": "第1次産業就業者比率",
            "colorRole": "improve"
          },
          {
            "metricKey": "employed-people-ratio-secondary",
            "label": "第2次産業就業者比率",
            "colorRole": "population"
          },
          {
            "metricKey": "employed-people-ratio-tertiary",
            "label": "第3次産業就業者比率",
            "colorRole": "series-12"
          }
        ],
        "topN": 3
      },
      "relatedRankingKeys": [
        "employed-people-ratio-primary",
        "employed-people-ratio-secondary",
        "employed-people-ratio-tertiary"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "industry",
      "sortOrder": 10
    },
    {
      "componentKey": "md-local-economy-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "県民1人当たりの所得と納税者1人当たりの所得は分母が異なり、家計の手取り額ではありません。\n\n産業別就業者の割合から地域の仕事の構成を確認します。産出額は就業者の割合や所得とは別の尺度です。\n\n事業所数は2014年までの過去参考です。現在の事業所規模を表す数値として扱いません。"
      },
      "sourceName": "経済財政白書 (令和7年版) / 中小企業白書 (2024年版) / 地方財政白書 (令和8年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 20
    },
    {
      "componentKey": "md-local-economy-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 所得形成の水準を見るときの注意は？\n\n県民1人当たりの所得と納税者1人当たりの所得は分母が異なり、家計の手取り額ではありません。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n賃金・雇用環境・家計・財政は関連テーマで詳しく確認できます。"
      },
      "sourceName": "経済財政白書 (令和7年版) / 中小企業白書 (2024年版) / 地方財政白書 (令和8年版) / 情報通信白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 環境白書 (令和7年版)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    },
    {
      "componentKey": "theme-le-establishments-trend",
      "componentType": "line-chart",
      "title": "全産業事業所数の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "number-of-establishments-economic-census-basic-survey"
          }
        ],
        "labels": [
          "事業所数"
        ],
        "seriesColors": [
          "population"
        ]
      },
      "relatedRankingKeys": [
        "number-of-establishments-economic-census-basic-survey"
      ],
      "sourceName": "総務省・経済産業省「経済センサス」",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "establishments",
      "sortOrder": 40
    }
  ],
  "evidenceTopics": [
    {
      "key": "employment-industry-composition",
      "lensKey": "composition",
      "title": "就業者の産業構成",
      "question": "第1次・第2次・第3次産業で働く就業者の構成は、地域ごとにどう異なるか。",
      "summary": "2020年国勢調査の調査週間に実際に働いた主な事業所の産業で就業者を分類する。産業分類不能の就業者は各区分の分子に含まれないため、3区分の比率の合計が必ずしも100％にはならない。",
      "sourceKeys": [
        "stat-census-2020-employment-status"
      ],
      "relatedRankingKeys": [
        "employed-people-ratio-primary",
        "employed-people-ratio-secondary",
        "employed-people-ratio-tertiary"
      ],
      "relatedChartKeys": [
        "theme-industry-structure"
      ],
      "relatedThemeKeys": [
        "manufacturing",
        "labor-mobility"
      ]
    },
    {
      "key": "business-base-density",
      "lensKey": "service-capacity",
      "title": "地域の事業所基盤",
      "question": "事業活動を継続して行う場所は、人口規模や面積を踏まえると地域ごとにどれほどあるか。",
      "summary": "事業所総数だけでは人口・面積の大きい地域ほど多くなるため、人口10万人当たり・面積100平方キロメートル当たりも併読する。農林漁家の個人経営などは対象外で、2009年と2014年は産業分類が異なり、2014年は福島県の一部調査区を除く。",
      "sourceKeys": [
        "stat-economic-census-basic-2014"
      ],
      "relatedRankingKeys": [
        "number-of-establishments-economic-census-basic-survey"
      ],
      "relatedChartKeys": [
        "theme-le-establishments-trend"
      ],
      "relatedThemeKeys": [
        "manufacturing",
        "labor-mobility"
      ]
    }
  ],
  "keywords": [
    "地域経済",
    "県内総生産",
    "GDP",
    "県民所得",
    "課税所得",
    "産業構造",
    "就業者",
    "失業率",
    "有効求人倍率",
    "製造品出荷額",
    "財政力指数",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "income",
      "title": "所得形成の水準",
      "description": "県民1人当たりの所得と納税者1人当たりの所得は分母が異なり、家計の手取り額ではありません。",
      "metricGroupKeys": [
        "income-1",
        "income-2"
      ],
      "chartKeys": []
    },
    {
      "key": "industry",
      "title": "どの産業で働いているか",
      "description": "産業別就業者の割合から地域の仕事の構成を確認します。産出額は就業者の割合や所得とは別の尺度です。",
      "metricGroupKeys": [
        "industry-1",
        "industry-2"
      ],
      "chartKeys": [
        "theme-industry-structure"
      ]
    },
    {
      "key": "establishments",
      "title": "事業所基盤の過去参考",
      "description": "事業所数は2014年までの過去参考です。現在の事業所規模を表す数値として扱いません。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-le-establishments-trend"
      ]
    },
    {
      "key": "reading",
      "title": "読み方と関連する仕事・財政",
      "description": "賃金・雇用環境・家計・財政は関連テーマで詳しく確認できます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-local-economy-discussion",
        "md-local-economy-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "income-1",
      "title": "1人当たり県民所得",
      "rankingKeys": [
        "per-capita-prefectural-income-h27"
      ],
      "defaultCheckedKeys": [
        "per-capita-prefectural-income-h27"
      ]
    },
    {
      "key": "income-2",
      "title": "課税対象所得（納税義務者1人当たり）",
      "rankingKeys": [
        "per-taxpayer-taxable-income"
      ],
      "defaultCheckedKeys": [
        "per-taxpayer-taxable-income"
      ]
    },
    {
      "key": "industry-1",
      "title": "第1次産業就業者比率・第2次産業就業者比率",
      "rankingKeys": [
        "employed-people-ratio-primary",
        "employed-people-ratio-secondary",
        "employed-people-ratio-tertiary"
      ],
      "defaultCheckedKeys": [
        "employed-people-ratio-primary",
        "employed-people-ratio-secondary"
      ]
    },
    {
      "key": "industry-2",
      "title": "農業産出額",
      "rankingKeys": [
        "agricultural-output"
      ],
      "defaultCheckedKeys": [
        "agricultural-output"
      ]
    }
  ]
};
