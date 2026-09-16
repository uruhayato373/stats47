import type { ThemeCatalog } from "./types";

export const LABOR_MOBILITY_CATALOG: ThemeCatalog = {
  "key": "labor-mobility",
  "title": "人材流動性・雇用環境",
  "description": "求人・失業から雇用の需給を、離職・転職から仕事の移動を読み分ける。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "turnover-rate",
      "shortLabel": "離職率",
      "role": "primary",
      "selection": {
        "proposedBy": "令和4年就業構造基本調査結果報告書 用語の解説（茨城県統計課、総務省統計局調査に基づく）",
        "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/rodo/syugyo04-2/yougo.html",
        "surveyedAt": "2026-09-16",
        "rationale": "総務省の就業構造基本調査を基にした用語解説は「離職者」を過去1年間に仕事を辞めて現在無業の者と定義しており、離職率はこの離職者数を継続就業者・転職者と合わせた母数で割った値である。仕事を辞めて再就業していない層を都道府県間で比較できるため、雇用環境から労働市場を離れる動きを直接示す代表指標として位置付けられる。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の地域は仕事を辞めたまま無業になっている人の割合が高いのか低いのか。",
        "targetReaderOrDecision": "地域の雇用の安定性を評価したい自治体職員や求職者支援機関の担当者。"
      }
    },
    {
      "rankingKey": "job-change-rate",
      "shortLabel": "転職率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和4年就業構造基本調査結果報告書 用語の解説（茨城県統計課、総務省統計局調査に基づく）",
        "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/rodo/syugyo04-2/yougo.html",
        "surveyedAt": "2026-09-16",
        "rationale": "同じ用語解説は「転職者」を過去1年間に前職を辞めて現職に就いた者と定義しており、転職率はこの転職者数を現在の有業者数で割った値である。離職率が仕事を離れる動きを表すのに対し、転職率は仕事を移る動きを表すため、両者を並べることで離職と転職という異なる就業異動の種類を読み分けられる補完的な指標となる。",
        "adoptionCriteria": ["complementarity", "comparability"],
        "readerQuestion": "自分の地域では仕事を辞めた人のうちどれくらいが別の仕事に移っているのか。",
        "targetReaderOrDecision": "地域の人材流動性を把握したい労働政策担当者や転職支援サービス事業者。"
      }
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "primary",
      "selection": {
        "proposedBy": "一般職業紹介状況(職業安定業務統計) 労働統計所在案内（労働政策研究・研修機構）",
        "sourceUrl": "https://www.jil.go.jp/kokunai/statistics/shozai/html/a01.html",
        "surveyedAt": "2026-09-16",
        "rationale": "一般職業紹介状況の解説は有効求人倍率をハローワークの月間有効求人数を月間有効求職者数で割った値と定義しており、求職者1人あたり何件の求人があるかを毎月・地域別に把握できる。求人と求職のバランスを直接示すため、人手不足や雇用の需給ひっ迫の度合いを測る中心指標として位置付けられる。",
        "adoptionCriteria": ["representativeness", "dataQuality"],
        "readerQuestion": "自分の地域は求職者に対して求人がどれだけあるのか。",
        "targetReaderOrDecision": "求人難や人手不足の実態を確認したい企業経営者や自治体の産業政策担当者。"
      }
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "secondary",
      "selection": {
        "proposedBy": "労働力調査かんたんガイド（総務省統計局）",
        "sourceUrl": "https://www.stat.go.jp/data/roudou/kantan/gaiyo.html",
        "surveyedAt": "2026-09-16",
        "rationale": "総務省統計局の解説によれば完全失業率は労働力調査の中核的な公表結果の一つであり、月例経済報告の雇用指標として景気判断や雇用対策に活用されている。国勢調査に基づく5年分の時系列データを都道府県別に比較することで、地域の労働市場の需給ひっ迫度を長期的に確認できる指標として位置付けられる。",
        "adoptionCriteria": ["comparability", "dataQuality"],
        "readerQuestion": "自分の地域の完全失業率はこの20年でどう変化してきたのか。",
        "targetReaderOrDecision": "地域経済の景気判断や雇用対策の効果を確認したい行政担当者。"
      }
    },
    {
      "rankingKey": "employment-rate",
      "shortLabel": "就職率（公共職業安定所）",
      "role": "secondary",
      "selection": {
        "proposedBy": "一般職業紹介状況(職業安定業務統計) 労働統計所在案内（労働政策研究・研修機構）",
        "sourceUrl": "https://www.jil.go.jp/kokunai/statistics/shozai/html/a01.html",
        "surveyedAt": "2026-09-16",
        "rationale": "一般職業紹介状況の解説では就職率をハローワークの就職件数を求職申込件数で除した値としており、求職活動がどれだけ実際の就職に結びついているかを示す。有効求人倍率が需給の量的バランスを示すのに対し、就職率は職業紹介の成立度合いを示すため、求人・求職環境を別角度から補完する指標として位置付けられる。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "自分の地域ではハローワークでの求職活動がどれだけ実際の就職につながっているのか。",
        "targetReaderOrDecision": "職業紹介の実効性を確認したいハローワーク利用者や就労支援担当者。"
      }
    },
    {
      "rankingKey": "telework-rate",
      "shortLabel": "テレワーク率",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和4年就業構造基本調査結果報告書 用語の解説（茨城県統計課、総務省統計局調査に基づく）",
        "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/rodo/syugyo04-2/yougo.html",
        "surveyedAt": "2026-09-16",
        "rationale": "就業構造基本調査の用語解説はテレワークを有業者がICTを活用してオフィス以外の場所で働くことと定義しており、令和4年調査で初めて都道府県別に集計された新しい働き方の指標である。就業の状態や通勤との関係を地域間で比較する材料となり、離職・転職といった移動とは異なる「働き方の柔軟性」という角度からテーマを補完する。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "自分の地域では働く人のうちどれくらいがテレワークを実施しているのか。",
        "targetReaderOrDecision": "地域の働き方の柔軟性や通勤負担の変化を知りたい在宅勤務希望者や企業の人事担当者。"
      }
    },
    {
      "rankingKey": "side-job-rate",
      "shortLabel": "副業率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/shugyou/2022/index.html",
        "surveyedAt": "2026-09-08",
        "rationale": "副業率は「就業の状態と働き方」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "monthly-average-actual-working-hours-male",
      "shortLabel": "月間平均実労働時間（男性）",
      "role": "context",
      "selection": {
        "proposedBy": "労働政策研究・研修機構「労働統計用語解説」112 実労働時間数の項（JILPT）",
        "sourceUrl": "https://www.jil.go.jp/kokunai/statistics/yougo/d21.html",
        "surveyedAt": "2026-09-16",
        "rationale": "この用語解説は、毎月勤労統計調査で用いられる実労働時間数を「労働者が実際に労働した時間数」と明確に定義し、所定内・所定外労働時間との合成関係を示している。月間平均実労働時間数（男性）はこの実労働時間数を性別・都道府県別に集計した値であり、長時間就業の地域差を比較する章の土台となる基礎統計として位置付けられる。",
        "adoptionCriteria": ["comparability", "dataQuality"],
        "readerQuestion": "自分の住む都道府県の男性労働者は全国平均より長く働いているか。",
        "targetReaderOrDecision": "労働時間の地域差を確認したい読者・自治体の労働政策担当者。"
      }
    },
    {
      "rankingKey": "employment-mobility-rate",
      "shortLabel": "就業異動率",
      "role": "secondary",
      "selection": {
        "proposedBy": "政府統計の総合窓口(e-Stat)「指標計算式」F 労働 F04104「就業異動率」",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/F",
        "surveyedAt": "2026-09-16",
        "rationale": "e-Statの指標計算式ページは、就業異動率が転職者数・離職者数・新規就業者数を合算し15歳以上人口で割った合成指標であることを明示している。この定義は、離職・転職・新規就業という異なる動きをひとつの比率にまとめる指標であり、テーマの「離職・転職・就業異動の違い」という論点や「就業異動率を詳しく見る」章の代表指標として直接対応する。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の県では転職・離職・新規就業を合わせた人の動きはどれくらい活発か。",
        "targetReaderOrDecision": "地域の労働移動の活発さを都道府県間で比較したい読者。"
      }
    },
    {
      "rankingKey": "day-time-population-ratio",
      "shortLabel": "昼夜間人口比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "政府統計の総合窓口(e-Stat)「指標計算式」A 人口・世帯 A6108「昼夜間人口比率」",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A",
        "surveyedAt": "2026-09-16",
        "rationale": "e-Statの指標計算式ページはA6108コードを昼夜間人口比率として定義しており、国勢調査の常住人口に対する通勤・通学による流入出を反映した指標であることを示す。この比率は「通勤通学と昼間人口」章で、就業地としての中心性や通勤流動の地域差を捉える中心指標として機能する。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の県は通勤・通学で人口が流入する側か、流出する側か。",
        "targetReaderOrDecision": "通勤・通学による昼夜間の人口移動を把握したい読者や都市計画担当者。"
      }
    },
    {
      "rankingKey": "day-time-population",
      "shortLabel": "昼間人口",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-14",
        "rationale": "昼夜間人口比率(率)の実数根拠として、就業地への流入規模を詳細索引に保持する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "labor-mobility-turnover-vs-jobchange",
      "componentType": "line-chart",
      "title": "離職率と転職率の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "turnover-rate"
          },
          {
            "metricKey": "job-change-rate"
          }
        ],
        "labels": [
          "離職率",
          "転職率"
        ],
        "seriesColors": [
          "danger",
          "improve"
        ]
      },
      "relatedRankingKeys": [
        "turnover-rate",
        "job-change-rate"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "turnover",
      "sortOrder": 10
    },
    {
      "componentKey": "md-labor-mobility-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "求人倍率、失業率、公共職業安定所の就職率は対象と年が異なります。別年の数値を同時点の需給や収支として計算しません。\n\n離職率と転職率は母集団・期間が異なります。同じ人の流入と流出を示す組合せではありません。\n\n働き方と昼夜間人口を確認します。昼夜間人口比率には通勤だけでなく通学も含まれます。"
      },
      "sourceName": "労働経済白書 (令和7年版) / 厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 経済財政白書 (令和7年版) / 賃金構造基本統計調査 (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 20
    },
    {
      "componentKey": "md-labor-mobility-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 求人と失業の需給を見るときの注意は？\n\n求人倍率、失業率、公共職業安定所の就職率は対象と年が異なります。別年の数値を同時点の需給や収支として計算しません。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n人の移動、就業状態、職業紹介の結果を分けて読みます。"
      },
      "sourceName": "労働経済白書 (令和7年版) / 厚生労働白書 (令和7年版) / 三位一体の労働市場改革 (内閣官房)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 30
    },
    {
      "componentKey": "theme-lm-employment-mobility-trend",
      "componentType": "line-chart",
      "title": "就業異動率の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "employment-mobility-rate"
          }
        ],
        "labels": [
          "就業異動率"
        ],
        "seriesColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "employment-mobility-rate"
      ],
      "sourceName": "総務省 社会・人口統計体系（労働）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "employment-mobility",
      "sortOrder": 40
    }
  ],
  "evidenceTopics": [
    {
      "key": "job-separation-and-change",
      "lensKey": "mobility",
      "title": "離職・転職・就業異動の違い",
      "question": "離職、転職、新規就業を分けると、地域の就業異動はどう見えるか。",
      "summary": "2022年就業構造基本調査の1年前との状態変化を読む。離職率は継続就業者・転職者・離職者の合計、転職率は現在の有業者、就業異動率は15歳以上人口が分母で互いに異なるため、率の大小をそのまま差し引かない。",
      "sourceKeys": [
        "stat-employment-status-survey-2022"
      ],
      "relatedRankingKeys": [
        "turnover-rate",
        "job-change-rate",
        "employment-mobility-rate"
      ],
      "relatedChartKeys": [
        "labor-mobility-turnover-vs-jobchange",
        "theme-lm-employment-mobility-trend"
      ],
      "relatedThemeKeys": [
        "labor-wages",
        "local-economy"
      ]
    },
    {
      "key": "telework-participation",
      "lensKey": "participation",
      "title": "テレワーク実施の地域差",
      "question": "有業者のうちテレワークを実施した人の割合には、どのような地域差があるか。",
      "summary": "2022年の有業者を分母に、テレワークを実施した人の割合を比べる単年の構造調査である。産業・職業構成の違いを含むため、地域差を通信環境や制度の効果だけで説明せず、時系列変化とも解釈しない。",
      "sourceKeys": [
        "stat-employment-status-survey-2022"
      ],
      "relatedRankingKeys": [
        "telework-rate"
      ],
      "relatedThemeKeys": [
        "labor-wages",
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "離職率",
    "転職率",
    "有効求人倍率",
    "テレワーク",
    "人材流動性",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "job-market",
      "title": "求人・求職と職業紹介",
      "description": "求人倍率、失業率、公共職業安定所の就職率は対象と年が異なります。別年の数値を同時点の需給や収支として計算しません。",
      "metricGroupKeys": [
        "job-market-1",
        "job-market-2",
        "job-market-3"
      ],
      "chartKeys": []
    },
    {
      "key": "turnover",
      "title": "離職と転職",
      "description": "離職率と転職率は母集団・期間が異なります。同じ人の流入と流出を示す組合せではありません。",
      "metricGroupKeys": [
        "turnover"
      ],
      "chartKeys": [
        "labor-mobility-turnover-vs-jobchange"
      ]
    },
    {
      "key": "work-style",
      "title": "就業の状態と働き方",
      "description": "働き方と昼夜間人口を確認します。昼夜間人口比率には通勤だけでなく通学も含まれます。",
      "metricGroupKeys": [
        "work-style"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "commute-flow"
      ]
    },
    {
      "key": "employment-mobility",
      "title": "就業異動率を詳しく見る",
      "description": "就業異動率は15歳以上人口に対する就業状態の変化を示し、離職率・転職率とは分母が異なります。",
      "metricGroupKeys": [
        "employment-mobility"
      ],
      "chartKeys": [
        "theme-lm-employment-mobility-trend"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "人の移動、就業状態、職業紹介の結果を分けて読みます。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-labor-mobility-discussion",
        "md-labor-mobility-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "job-market-1",
      "title": "有効求人倍率",
      "rankingKeys": [
        "active-job-opening-ratio"
      ],
      "defaultCheckedKeys": [
        "active-job-opening-ratio"
      ]
    },
    {
      "key": "job-market-2",
      "title": "失業率",
      "rankingKeys": [
        "unemployment-rate"
      ],
      "defaultCheckedKeys": [
        "unemployment-rate"
      ]
    },
    {
      "key": "job-market-3",
      "title": "就職率（公共職業安定所）",
      "rankingKeys": [
        "employment-rate"
      ],
      "defaultCheckedKeys": [
        "employment-rate"
      ]
    },
    {
      "key": "turnover",
      "title": "離職と転職",
      "rankingKeys": [
        "turnover-rate",
        "job-change-rate"
      ],
      "defaultCheckedKeys": [
        "turnover-rate",
        "job-change-rate"
      ]
    },
    {
      "key": "work-style",
      "title": "就業の状態と働き方",
      "rankingKeys": [
        "telework-rate",
        "day-time-population-ratio"
      ],
      "defaultCheckedKeys": [
        "telework-rate",
        "day-time-population-ratio"
      ]
    },
    {
      "key": "employment-mobility",
      "title": "就業異動率を詳しく見る",
      "rankingKeys": [
        "employment-mobility-rate"
      ],
      "defaultCheckedKeys": [
        "employment-mobility-rate"
      ]
    }
  ]
};
