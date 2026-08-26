import type { ThemeCatalog } from "./types";

export const POPULATION_DYNAMICS_CATALOG: ThemeCatalog = {
  "key": "population-dynamics",
  "title": "人口動態",
  "description": "都道府県の人口増減を、増減率、出生・死亡、転入・転出、年齢構成の順に整理。結果と要因を分けて47都道府県で比較できます。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "total-population",
      "shortLabel": "総人口",
      "role": "context",
      "selection": {
        "proposedBy": "総務省統計局「人口推計（2024年10月1日現在）」",
        "sourceUrl": "https://www.stat.go.jp/data/jinsui/2024np/index.html",
        "surveyedAt": "2026-07-11",
        "rationale": "人口増減率の母数・規模を把握するために必要な基礎指標"
      }
    },
    {
      "rankingKey": "total-fertility-rate",
      "shortLabel": "合計特殊出生率",
      "role": "context"
    },
    {
      "rankingKey": "moving-in-excess-rate",
      "shortLabel": "転入超過率",
      "role": "context"
    },
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "高齢化率",
      "role": "context"
    },
    {
      "rankingKey": "population-growth-rate",
      "shortLabel": "人口増減率",
      "role": "primary",
      "selection": {
        "proposedBy": "総務省統計局「人口推計（2024年10月1日現在）」",
        "sourceUrl": "https://www.stat.go.jp/data/jinsui/2024np/index.html",
        "surveyedAt": "2026-07-11",
        "rationale": "テーマの主問「人口がなぜ増減しているか」の結果を直接表す指標。2024年・47都道府県で取得可能"
      }
    },
    {
      "rankingKey": "natural-increase-rate",
      "shortLabel": "自然増減率",
      "role": "secondary",
      "selection": {
        "proposedBy": "総務省統計局「人口推計（2024年10月1日現在）」",
        "sourceUrl": "https://www.stat.go.jp/data/jinsui/2024np/index.html",
        "surveyedAt": "2026-07-11",
        "rationale": "公式統計は人口増減率を自然増減率と社会増減率に分解して説明しており、出生・死亡による要因分解の中心指標。2024年まで利用可"
      }
    },
    {
      "rankingKey": "crude-birth-rate",
      "shortLabel": "粗出生率",
      "role": "context",
      "selection": {
        "proposedBy": "厚生労働省「人口動態調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-07-11",
        "rationale": "自然増減の内訳（出生側）。主問への直接回答ではなく要因分解の補助指標として整理"
      }
    },
    {
      "rankingKey": "crude-death-rate",
      "shortLabel": "死亡率",
      "role": "context",
      "selection": {
        "proposedBy": "厚生労働省「人口動態調査」",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-07-11",
        "rationale": "自然増減の内訳（死亡側）。natural-increase-rateの構成要素"
      }
    },
    {
      "rankingKey": "social-increase-rate",
      "shortLabel": "社会増減率",
      "role": "context",
      "selection": {
        "proposedBy": "総務省統計局「人口推計（2024年10月1日現在）」",
        "sourceUrl": "https://www.stat.go.jp/data/jinsui/2024np/index.html",
        "surveyedAt": "2026-07-11",
        "rationale": "転入・転出による要因分解の中心指標。ただし現行MetricConfigは2018-2019年までのため、主要カードへの採用は鮮度解決まで保留し context に留める"
      }
    },
    {
      "rankingKey": "young-population-ratio",
      "shortLabel": "年少人口割合",
      "role": "context"
    },
    {
      "rankingKey": "population-density-per-km2-inhabitable-area",
      "shortLabel": "人口密度",
      "role": "context"
    },
    {
      "rankingKey": "day-time-population-ratio",
      "shortLabel": "昼夜間人口比率",
      "role": "context"
    }
  ],
  "metricGroups": [
    {
      "key": "population-change",
      "title": "人口増減の結果と自然増減",
      "rankingKeys": [
        "population-growth-rate",
        "natural-increase-rate"
      ],
      "defaultCheckedKeys": [
        "population-growth-rate",
        "natural-increase-rate"
      ]
    }
  ],
  "charts": [
    {
      "componentKey": "birth-death-count-trend",
      "componentType": "line-chart",
      "title": "自然増減：出生数と死亡数",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010101",
            "cdCat01": "A4101"
          },
          {
            "statsDataId": "0000010101",
            "cdCat01": "A4200"
          }
        ],
        "labels": [
          "出生数",
          "死亡数"
        ],
        "seriesColors": [
          "improve",
          "neutral"
        ]
      },
      "relatedRankingKeys": [
        "natural-increase-rate",
        "crude-birth-rate",
        "crude-death-rate"
      ],
      "sourceName": "総務省 社会・人口統計体系（人口動態統計）",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "人口の増減要因",
      "sortOrder": 10
    },
    {
      "componentKey": "theme-pop-migration-trend",
      "componentType": "line-chart",
      "title": "社会増減：転入者数と転出者数",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010101",
            "cdCat01": "A5103"
          },
          {
            "statsDataId": "0000010101",
            "cdCat01": "A5104"
          }
        ],
        "labels": [
          "転入者数",
          "転出者数"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "social-increase-rate"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "人口の増減要因",
      "sortOrder": 20
    },
    {
      "componentKey": "theme-age-composition",
      "componentType": "composition-chart",
      "title": "人口構造：年齢3区分の推移",
      "componentProps": {
        "statsDataId": "0000010101",
        "segments": [
          {
            "code": "A1301",
            "label": "年少人口(0〜14歳)",
            "color": "improve"
          },
          {
            "code": "A1302",
            "label": "生産年齢人口(15〜64歳)",
            "color": "population"
          },
          {
            "code": "A1303",
            "label": "老年人口(65歳以上)",
            "color": "count"
          }
        ],
        "totalCode": "A1101"
      },
      "relatedRankingKeys": [
        "ratio-65-plus",
        "young-population-ratio",
        "total-population"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "人口構造",
      "sortOrder": 30
    },
    {
      "componentKey": "theme-population-pyramid",
      "componentType": "pyramid-chart",
      "title": "人口構造：人口ピラミッド",
      "componentProps": {},
      "relatedRankingKeys": [
        "total-population",
        "ratio-65-plus"
      ],
      "sourceName": "総務省 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "人口構造",
      "sortOrder": 40
    },
    {
      "componentKey": "md-population-dynamics-discussion",
      "componentType": "markdown-section",
      "title": "データの読み解き — 人口動態の構造的要因",
      "componentProps": {
        "subtitle": "白書から見る、なぜ東京圏一極集中と地方の人口流出が続くのか",
        "markdown": "日本の総人口は2008年の1億2,808万人をピークに減少に転じ、2024年時点で1億2,380万人となった。2070年には約8,700万人まで縮小すると推計されている。47都道府県を横並びで見ると、出生率・社会増減・転入超過率に大きな格差があり、その差は単純な人口規模ではなく、進学・産業・住居・社会意識が複合的に絡んだ構造から生じている。本稿では各種白書のデータを基に、その構造を読み解く。\n\n### 現状 — 自然減と社会減の二重構造\n\n2024年の出生数は68万6,061人と統計開始以来初めて70万人を下回り、合計特殊出生率は1.15と過去最低を更新した。死亡数が出生数を上回る「自然減」は**全都道府県で発生**している。一方で「社会増減」（転入と転出の差）でプラスとなったのは2024年時点で女性が7都府県、男性が8都府県のみで、残りの約40道府県は転出超過に陥っている。男女ともに増加したのは東京都だけという、極端な集中構造となっている。\n\n都道府県間の人口移動は10代後半〜20代が中心で、22歳前後がピークとなる。1990年代後半以降、東京圏（東京・神奈川・埼玉・千葉）への転入超過が継続しており、2009年以降は女性の転入超過数が男性を上回って推移している。15〜24歳の年齢層で見ると、東京圏に留まる比率は女性が転入/転出比率2.9倍、男性2.2倍と、若年女性ほど都市部に定着する傾向が強い。\n\n### 都道府県差の構造 — 「教育・産業・住居・意識」の 4 要因\n\n地方からの人口流出には、以下の構造的要因が積み重なっている。\n\n**(1) 進学・教育機会の偏在**\n\n大学進学率は東京都77.6%に対し宮崎県38.7%と2倍近い開きがある。東京都の大学入学定員は18歳人口に対して164.5%に達しており、自県内に進学先が少ない地方では、若年層が18〜22歳の時点で大量に流出する。大学進学時に東京都へは約7.8万人が純流入する一方、茨城県や静岡県では1万人規模の流出超過となる。\n\n**(2) 産業構造と賃金格差**\n\n2024年の所定内給与は東京都が最も高く（女性33.8万円、男性44.1万円）、青森県や沖縄県との差は10万円以上に及ぶ。地方では「医療・福祉」「製造業」に雇用が偏り、長崎県などでは女性正規雇用者の35%超が医療・福祉に集中する。一方、都市部は情報通信業など多様な選択肢があり、20代女性の東京圏流入と有効求人倍率には r=0.88 という強い正の相関が観測されている。\n\n**(3) 住居コストと物価**\n\n消費者物価地域差指数は東京都104.5・鹿児島県95.9と差があり、東京都の物価押し上げ要因の中核は「住居」費にある。都区部の民営家賃は近年30年ぶりの伸びを示し、20代住宅ローン保有世帯では可処分所得に占める返済負担率（DSR）が22.0%まで上昇している。地方の方が物価・家賃が安く、名目所得の差をある程度相殺する構造はあるものの、進学・就職時点の意思決定では住居コストが流入を抑制する要因にはなりにくい。\n\n**(4) 社会的意識と「生きづらさ」**\n\n地方（東北・北陸・四国など）では「家事・育児・介護は女性の仕事」という固定的な性別役割分担意識が依然として根強い。東京圏へ転出した女性が出身地を離れた理由としては「やりたい仕事の少なさ」だけでなく、「地元から離れたかった」「親や周囲の干渉から逃れたかった」という閉塞感が男性より高い割合で挙げられている。\n\n### 政策的含意 — 「こども・子育て支援加速化」と「地方創生 2.0」\n\n政府は2030年までを少子化トレンドを反転させる「ラストチャンス」と位置づけ、3年間累計3.2兆円規模（事業費ベース3.6兆円）の「こども・子育て支援加速化プラン」を推進している。児童手当の拡充、出生後休業支援給付の創設（2025年4月施行）、育児時短就業給付の創設などが含まれる。\n\nあわせて「地方創生 2.0」として、「地方こそ成長の主役」とする方針の下、令和8年度地方財政計画で「地域未来基金費」4,000億円、「地方創生推進費」1兆円が計上された。デジタル田園都市国家構想の発展形として、二地域居住の促進やデジタル技術を活用した柔軟な働き方の地方実装が進められている。\n\n### 読み解きのコツ\n\n人口減少を読むときは、**自然減（出生減・死亡増）と社会減（若年流出）を分けて見る**ことが本質的である。同じ「人口減少県」でも、自然減が主因の県（高齢化が進み出生数が少ない）と、社会減が主因の県（若年層が大量流出している）では、必要な対策が全く異なる。\n\nさらに社会減を見る際は、男女別の転入超過数を分けて読むと、構造がより明確になる。20代女性の流出が極端な県では、賃金水準だけでなく職種選択肢・働き方の柔軟性・性別役割意識といった「社会環境管理」の課題が中核にある。47都道府県を横並びで比較する場合、ランキング上位/下位そのものより、**「なぜその水準なのか」を構造で説明できるか**が、データの読み解きとして本質的である。",
        "sources": [
          {
            "label": "厚生労働白書 (令和7年版)",
            "url": "https://www.mhlw.go.jp/stf/wp/hakusyo/kousei/index.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          },
          {
            "label": "少子化社会対策白書 (令和6年版)",
            "url": "https://www8.cao.go.jp/shoushi/shoushika/whitepaper/index.html"
          },
          {
            "label": "日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
            "url": "https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp"
          }
        ]
      },
      "sourceName": "厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 少子化社会対策白書 (令和6年版) / 日本の将来推計人口 (令和5年推計) — 国立社会保障・人口問題研究所",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "読み解き",
      "sortOrder": 100
    },
    {
      "componentKey": "md-population-dynamics-related-topics",
      "componentType": "markdown-section",
      "title": "関連トピック・中長期課題",
      "componentProps": {
        "subtitle": "2025年問題から地方創生2.0まで",
        "markdown": "人口動態は単独の課題ではなく、社会保障・労働市場・教育・住宅政策など複数の領域が連動して進行している。各種白書から、特に重要度の高い5つの論点を整理する。\n\n### 1. 「2025年問題」と「2040年問題」\n\n**2025年問題**は、団塊の世代が全員75歳以上の後期高齢者に達する局面で、その数は約2,155万人（総人口の17.5%）。医療・介護需要が一段と高まる転換点となる。\n\n**2040年問題**はさらに深刻で、高齢者人口が約3,953万人とピークを迎える一方、生産年齢人口は2020年の約7,509万人から約6,213万人へと毎年約60万人ペースで減少する。社会保障の「支え手」が急速に細り、労働力供給が経済成長の制約となる構造的危機が顕在化する。\n\n### 2. 自然減と社会減の偏在 — 全県自然減・40 道府県社会減\n\n2024年時点で、自然減（死亡数 > 出生数）は**全都道府県で発生**している。一方、社会減（転出超過）は約40道府県で発生し、転入超過は東京都・神奈川県・千葉県・埼玉県など限定された都府県のみ。同じ「人口減少県」でも、対策の中身が異なる。\n\n若年女性の流出が特に顕著で、15〜24歳女性の東京圏転入/転出比率は2.9倍と、男性の2.2倍を上回る。地方の出生数減少と高齢化を同時に加速させる悪循環が起きている。\n\n### 3. こども・子育て支援加速化プランと全世代型社会保障\n\n政府は2024年度から3年間で累計**3.2兆円程度**（事業費ベース3.6兆円）を「こども・子育て支援加速化プラン」に投じている。児童手当の所得制限撤廃・第3子以降3万円への引上げ、2025年4月施行の「出生後休業支援給付」（出生後一定期間に両親が育休取得すると賃金の手取り10割相当を支給）、「育児時短就業給付」（2歳未満の時短勤務に対し賃金の1割を支給）などが柱。\n\n社会保障給付費は2024年度予算ベースで**137.8兆円（対GDP比22.4%）**に達し、うち「こども・子育て」分野は10.8兆円。\n\n### 4. 地方創生 2.0 と「人の流れ」の創出\n\n令和8年度（FY2026）の地方財政計画では、「地域未来基金費」**4,000億円**を新規計上し、産業クラスター形成・地場産業の付加価値向上に充てる。あわせて「地方創生推進費」**1兆円**を計上。二地域居住の促進、デジタル技術を活用した魅力ある地方の職場づくり、女性が活躍しやすい地域社会の整備が方針として示されている。\n\n### 5. 住宅政策と「コンパクト・プラス・ネットワーク」\n\n2025年4月から、原則すべての新築住宅に省エネ基準適合が義務化された。子育てグリーン住宅支援事業（約2,250億円）、子育てエコホーム支援事業（約2,100億円）が2024年度補正予算で計上されている。\n\nまた、人口減少下でも都市機能を維持するため、立地適正化計画による「コンパクト・プラス・ネットワーク」が進められており、2024年度末時点で全国**636市町村**が同計画を作成・公表済み。地方では2050年までに全市区町村の約2割で人口が2020年比で半数未満になる推計があり、地域社会の維持・インフラ管理の困難化への適応策が急務となっている。",
        "sources": [
          {
            "label": "厚生労働白書 (令和7年版)",
            "url": "https://www.mhlw.go.jp/stf/wp/hakusyo/kousei/index.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          },
          {
            "label": "少子化社会対策白書 (令和6年版)",
            "url": "https://www8.cao.go.jp/shoushi/shoushika/whitepaper/index.html"
          },
          {
            "label": "地方財政計画 (令和8年度) — 総務省",
            "url": "https://www.soumu.go.jp/menu_seisaku/hakusyo/index.html"
          }
        ]
      },
      "sourceName": "厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 少子化社会対策白書 (令和6年版) / 地方財政計画 (令和8年度) — 総務省",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "読み解き",
      "sortOrder": 110
    },
    {
      "componentKey": "md-population-dynamics-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "subtitle": "人口動態について読者が気になる 7 問",
        "markdown": "### Q1: 合計特殊出生率とは?\n\n合計特殊出生率とは、1人の女性が一生の間に生むこどもの数の平均を指す指標。2024年の数値は**1.15**（概数）で、過去最低を更新した。人口を維持するのに必要な水準（人口置換水準）は約2.07とされ、現在の水準は長期的な人口減少を意味する。(出典: 厚生労働白書 令和7年版)\n\n### Q2: 日本の人口は将来どこまで減る?\n\n2008年の1億2,808万人をピークに減少が始まり、2024年時点で1億2,380万人。**2056年に1億人を割り込み、2070年には約8,700万人**まで減少すると見込まれている。生産年齢人口（15〜64歳）は同期間に約7,509万人から約6,213万人へ縮小する見通し。(出典: 厚生労働白書 令和7年版 / 国土交通白書 2025)\n\n### Q3: 「東京圏一極集中」はいつから続いている?\n\n東京圏（1都3県）への転入超過は**1990年代後半から男女ともに継続**している。特に**女性の転入超過数が男性を上回るようになったのは2009（平成21）年以降**。直近2024年では、男女ともに人口が増加したのは東京都のみという極端な集中構造となっている。(出典: 男女共同参画白書 令和7年版)\n\n### Q4: 若い世代が地方を離れる最大の理由は?\n\nきっかけとして最も多いのは「自分の進学」と「自分の就職」。東京圏以外から東京圏へ転出した女性の42.1%が「希望する進学先が少なかった」を理由に挙げ、次いで「やりたい仕事や就職先の少なさ」が続く。大学進学率は東京都77.6% vs 宮崎県38.7% と2倍近い開きがあり、進学機会の偏在が流出を構造化している。(出典: 男女共同参画白書 令和7年版)\n\n### Q5: なぜ地方の人口流出は特に女性に偏る?\n\n地方には女性が働きたいと思える職種が限定的（医療・福祉に集中）であることに加え、**「家事・育児・介護は女性の仕事」という固定的な性別役割分担意識**が依然として根強いことが背景にある。東京圏へ転出した女性は、男性に比べて「地元から離れたかった」「親や周囲の干渉から逃れたかった」を理由に挙げる割合が高い。(出典: 男女共同参画白書 令和7年版)\n\n### Q6: 「自然増減」と「社会増減」の違いは?\n\n**自然増減**は出生数から死亡数を引いたもので、現在は**全47都道府県で自然減**（死亡 > 出生）の状態にある。**社会増減**は転入数から転出数を引いたもので、2024年は東京都など**7〜8都府県のみが社会増**、残り約40道府県が転出超過。同じ「人口減少県」でも、自然減主因と社会減主因では必要な対策が異なる。(出典: 男女共同参画白書 令和7年版)\n\n### Q7: 平均初婚年齢や第1子出産年齢はどのくらい?\n\n晩婚化・晩産化が進行している。2023年の**平均初婚年齢は男性31.1歳、女性29.7歳**。**第1子出産時の母親平均年齢は31.0歳**で、1990年の27.0歳と比較して4歳上昇している。晩産化は1人あたり出生数の減少にも直結する。(出典: 厚生労働白書 令和7年版)",
        "sources": [
          {
            "label": "厚生労働白書 (令和7年版)",
            "url": "https://www.mhlw.go.jp/stf/wp/hakusyo/kousei/index.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          },
          {
            "label": "少子化社会対策白書 (令和6年版)",
            "url": "https://www8.cao.go.jp/shoushi/shoushika/whitepaper/index.html"
          }
        ]
      },
      "sourceName": "厚生労働白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 少子化社会対策白書 (令和6年版)",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "読み解き",
      "sortOrder": 120
    }
  ],
  "evidenceTopics": [
    {
      "key": "natural-population-change",
      "lensKey": "outcomes",
      "title": "出生と死亡から見る自然増減",
      "question": "出生と死亡の差は、地域の自然増減にどのように表れているか。",
      "summary": "人口動態統計の出生・死亡と自然増減率を結び付けます。粗出生率・粗死亡率は人口規模で標準化した率であり、出生数・死亡数そのものとは区別して読みます。",
      "sourceKeys": [
        "mhlw-vital-statistics-2024"
      ],
      "relatedRankingKeys": [
        "natural-increase-rate",
        "crude-birth-rate",
        "crude-death-rate"
      ],
      "relatedChartKeys": [
        "birth-death-count-trend"
      ],
      "relatedThemeKeys": [
        "aging-society"
      ]
    },
    {
      "key": "age-structure-balance",
      "lensKey": "composition",
      "title": "年少人口と高齢人口の構成",
      "question": "年少人口と65歳以上人口の構成には、どのような地域差があるか。",
      "summary": "人口推計の年齢3区分を、総人口に占める構成比として読みます。割合の差は人口規模の差を示さず、将来人口の予測値でもありません。",
      "sourceKeys": [
        "stat-population-estimates-2024"
      ],
      "relatedRankingKeys": [
        "young-population-ratio",
        "ratio-65-plus"
      ],
      "relatedChartKeys": [
        "theme-age-composition",
        "theme-population-pyramid"
      ],
      "relatedThemeKeys": [
        "aging-society"
      ]
    }
  ],
  "keywords": [
    "人口動態",
    "人口増減率",
    "自然増減率",
    "社会増減率",
    "高齢化率",
    "出生率",
    "死亡率",
    "転入超過",
    "都道府県",
    "ランキング"
  ]
};
