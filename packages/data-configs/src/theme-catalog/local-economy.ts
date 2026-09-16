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
        "proposedBy": "市町村税課税状況等の調（総務省、大阪府公表資料）",
        "sourceUrl": "https://www.pref.osaka.lg.jp/o040050/shichoson/zei/kazei06.html",
        "surveyedAt": "2026-09-16",
        "rationale": "この調査は地方自治法に基づき毎年実施される市町村税課税の唯一の統計資料であり、税制改正の基礎資料として位置付けられている。納税義務者1人当たりの課税対象所得は、県民経済計算の県民所得（企業所得等を含む経済全体の指標）とは異なり、個人の実際の課税ベースの所得水準を市町村単位まで比較できる点で、県民所得を補完する角度を提供する。",
        "adoptionCriteria": ["complementarity", "dataQuality"],
        "readerQuestion": "実際に税金を納めている住民1人当たりの所得は地域ごとにどれくらい違うのか。",
        "targetReaderOrDecision": "個人の所得水準を市区町村単位で比較したい読者・地方財政の担当者。"
      }
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "1人当たり県民所得",
      "role": "primary",
      "selection": {
        "proposedBy": "県民経済計算「統計の目的」（内閣府経済社会総合研究所）",
        "sourceUrl": "https://www.esri.cao.go.jp/jp/sna/sonota/kenmin/contents/mokuteki.html",
        "surveyedAt": "2026-09-16",
        "rationale": "内閣府経済社会総合研究所は県民経済計算を「総合的な県経済指標」と位置付け、県の行財政・経済政策の基礎資料とすると明記している。1人当たり県民所得はこの県民経済計算の中核指標であり、地域の所得形成水準を都道府県間で比較する際の代表指標として、テーマ「地域経済」の冒頭で扱うべき指標である。",
        "adoptionCriteria": ["representativeness", "readerValue"],
        "readerQuestion": "自分の都道府県の1人当たり県民所得は全国平均や他県と比べて高いか低いか。",
        "targetReaderOrDecision": "地域の所得水準を把握したい住民・地方自治体の政策担当者。"
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
        "proposedBy": "平成12年国勢調査 産業（大分類）別就業者数（総務省統計局）",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2000/kihon2/00/03.html",
        "surveyedAt": "2026-09-16",
        "rationale": "国勢調査は産業3部門別の就業者数・構成比を全国・都道府県単位で継続的に公表しており、第2次産業就業者比率は製造業・建設業など生産基盤の厚みを地域間で比較する際の代表的な指標として扱われている。第1次・第3次産業比率と組み合わせることで、地域の就業構造を3区分で立体的に把握できる。",
        "adoptionCriteria": ["representativeness", "comparability", "complementarity"],
        "readerQuestion": "自分の県は製造業や建設業で働く人の割合が全国と比べて多いか少ないか。",
        "targetReaderOrDecision": "地域の産業構造・雇用構成を比較したい読者。"
      }
    },
    {
      "rankingKey": "employed-people-ratio-tertiary",
      "shortLabel": "第3次産業就業者比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "平成12年国勢調査 産業（大分類）別就業者数（総務省統計局）",
        "sourceUrl": "https://www.stat.go.jp/data/kokusei/2000/kihon2/00/03.html",
        "surveyedAt": "2026-09-16",
        "rationale": "国勢調査の産業3部門別集計では第3次産業就業者が就業者全体の過半を占めることが示されており、サービス業や公務など第3次産業への就業比率は地域経済の産業構造のうち最も比重の大きい部分を示す。第1次・第2次産業比率と合わせて用いることで、就業構造全体（合計100%）を都道府県間で比較できる。",
        "adoptionCriteria": ["representativeness", "comparability", "complementarity"],
        "readerQuestion": "自分の県はサービス業など第3次産業で働く人の割合が全国と比べて多いか少ないか。",
        "targetReaderOrDecision": "地域の産業構造・雇用構成を比較したい読者。"
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
        "proposedBy": "生産農業所得統計の概要（農林水産省）",
        "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/gaiyou/",
        "surveyedAt": "2026-09-16",
        "rationale": "農林水産省は生産農業所得統計の利用上の注意として、都道府県別の農業産出額推計値は各地域の農業生産シェアを分析する用途に使うものと明示している。これは農業産出額が地域間の農業生産規模を比較するための指標であることを示しており、県民所得や産業別就業構成では捉えきれない農業という生産基盤の実額を補う指標である。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "自分の県の農業生産規模は全国の中でどれくらいの位置にあるか。",
        "targetReaderOrDecision": "地域の農業生産基盤の大きさを把握したい読者・農政担当者。"
      }
    },
    {
      "rankingKey": "agricultural-employment-population",
      "shortLabel": "農業就業人口",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-14",
        "rationale": "農業産出額と組み合わせて担い手規模を読む背景指標として詳細索引に保持する。"
      }
    },
    {
      "rankingKey": "electricity-generation-capacity",
      "shortLabel": "発電電力量",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-14",
        "rationale": "電力供給規模を産業基盤の背景条件として詳細索引に保持する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-industry-structure",
      "componentType": "line-chart",
      "title": "産業別就業者比率の推移",
      "annotation": "産業分類不詳などにより3系列の合計は100%になりません。元の就業者比率を表示しています。",
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
        ]
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
