import type { ThemeCatalog } from "./types";

export const LOCAL_ECONOMY_CATALOG: ThemeCatalog = {
  "key": "local-economy",
  "title": "地域経済",
  "description": "都道府県別のGDP・県民所得・産業構造・雇用・財政をランキングとチャートで比較。県内総生産、有効求人倍率、製造品出荷額、財政力指数など主要経済指標の推移を47都道府県のデータで確認できます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税所得",
      "role": "primary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "1人当たり県民所得",
      "role": "secondary"
    },
    {
      "rankingKey": "minimum-wage-by-region",
      "shortLabel": "最低賃金",
      "role": "secondary"
    },
    {
      "rankingKey": "active-job-opening-ratio",
      "shortLabel": "有効求人倍率",
      "role": "secondary"
    },
    {
      "rankingKey": "unemployment-rate",
      "shortLabel": "失業率",
      "role": "secondary"
    },
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "secondary"
    },
    {
      "rankingKey": "employed-people-ratio-primary",
      "shortLabel": "第1次産業就業者比率",
      "role": "context"
    },
    {
      "rankingKey": "employed-people-ratio-secondary",
      "shortLabel": "第2次産業就業者比率",
      "role": "context"
    },
    {
      "rankingKey": "employed-people-ratio-tertiary",
      "shortLabel": "第3次産業就業者比率",
      "role": "context"
    },
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得（二人以上の世帯のうち勤労者世帯）",
      "role": "context"
    },
    {
      "rankingKey": "number-of-establishments-economic-census-basic-survey",
      "shortLabel": "事業所数",
      "role": "context"
    },
  ],
  "charts": [
    {
      "componentKey": "theme-industry-structure",
      "componentType": "donut-chart",
      "title": "産業別就業者構成比",
      "componentProps": {
        "statsDataId": "0000010206",
        "categories": [
          {
            "code": "#F01201",
            "label": "第1次産業",
            "color": "improve"
          },
          {
            "code": "#F01202",
            "label": "第2次産業",
            "color": "population"
          },
          {
            "code": "#F01203",
            "label": "第3次産業",
            "color": "series-12"
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
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "雇用",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-economy-income-wage",
      "componentType": "line-chart",
      "title": "課税所得と最低賃金の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010112",
            "cdCat01": "L3130"
          },
          {
            "statsDataId": "0000010106",
            "cdCat01": "F6501"
          }
        ],
        "labels": [
          "課税所得（勤労者世帯）",
          "最低賃金"
        ],
        "seriesColors": [
          "population",
          "count"
        ]
      },
      "relatedRankingKeys": [
        "disposable-income-worker-households",
        "minimum-wage-by-region"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "所得",
      "sortOrder": 0
    },
    {
      "componentKey": "theme-economy-job-market",
      "componentType": "mixed-chart",
      "title": "有効求人倍率と完全失業率の推移",
      "componentProps": {
        "columnParams": [
          {
            "statsDataId": "0000010206",
            "cdCat01": "#F03103"
          }
        ],
        "lineParams": [
          {
            "statsDataId": "0000010206",
            "cdCat01": "#F01301"
          }
        ],
        "columnLabels": [
          "有効求人倍率"
        ],
        "lineLabels": [
          "完全失業率"
        ],
        "leftUnit": "倍",
        "rightUnit": "%",
        "columnColors": [
          "population"
        ],
        "lineColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "active-job-opening-ratio",
        "unemployment-rate"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "雇用",
      "sortOrder": 10
    },
    {
      "componentKey": "md-local-economy-discussion",
      "componentType": "markdown-section",
      "title": "データの読み解き — 地域経済の構造的格差",
      "componentProps": {
        "subtitle": "白書から見る、なぜ東京と地方で経済力にこれほど差があるのか",
        "markdown": "日本の名目GDPは2024年度に初めて600兆円を突破（617.0兆円）し、緩やかな回復基調にある。一方、47都道府県の経済力には極めて大きな偏在性が残る。地方政府は国内総生産の10.8%（69.7兆円）を占める巨大な経済主体だが、その内部では東京一極集中と地方経済の縮小という構造的な二極化が進行している。本稿では各種白書のデータを基に、その構造を読み解く。\n\n### 現状 — 税収格差は最大5.8倍\n\n令和6年度の人口1人当たり税収額指数（全国平均=100）では、地方税計で東京都（167.3）と長崎県（70.3）の間に約2.4倍の格差がある。企業の本社集積を反映する法人関係二税では、東京都（245.8）と奈良県（42.6）の間で約5.8倍の極端な偏在が生じている。所定内給与額も東京都（女性33.8万円・男性44.1万円）が全国最高で、青森県（女性22.4万円）や沖縄県（男性28.7万円）との差は大きい。一方、消費者物価地域差指数も東京都が104.5と最も高く、特に「住居」費が物価全体を押し上げている点には注意が必要である。\n\n### 都道府県差の構造 — 「人・カネ・産業」の3要因\n\n地域経済の格差は、3つの構造的要因が連動して生じている。\n\n**(1) 若年層・女性の社会減**\n\n令和6年（2024年）の人口増減で男女ともに増加したのは東京都のみ。残り40近い道府県は社会減少が続いている。東京圏への転入超過は平成21年（2009年）以降、女性が男性を上回って推移しており、地方の若年女性の流出が出生数減少と人口縮小を同時に引き起こす悪循環となっている。背景には大学進学率の差（東京都女性77.6% vs 宮崎県女性38.7%）や、「やりたい仕事・就職先の少なさ」という雇用機会の限定がある。\n\n**(2) 産業構造の偏在**\n\n正規雇用者に占める「医療・福祉」の割合は長崎県で42.5%に達し、女性雇用が同分野に偏る傾向が強い。一方「製造業」は北関東・甲信、東海、北陸などの特定地域に集中する。全国的にはサービス業が雇用シェアの約75%を占めるまで拡大しているが、サービス業は製造業に比べ労働生産性が低く、地域経済の成長余地を制約している。\n\n**(3) 寡占化と市場縮小**\n\n地方では人口減少により市場規模が縮小し、特に運輸・金融などで企業統廃合（寡占化）が進む。2020年施行のいわゆる地域特例法により、バス会社や地方銀行の合併・路線調整・運賃協定が独占禁止法の適用除外となっている。社会機能の維持と競争環境のバランスが課題である。\n\n### 政策的含意 — 「地方こそ成長の主役」への転換\n\n政府は2024年10月、「デジタル田園都市国家構想実現会議」を発展させ「新しい地方経済・生活環境創生本部」を設置。2025年6月閣議決定の地方創生2.0基本構想では、人口が減っても経済成長を維持する「適応策」を重視している。令和8年度（2026年度）には地場産業の付加価値向上と販路開拓を支援する「地域未来基金費」4,000億円を新たに地方財政計画に計上、その全額を道府県分の基準財政需要額に算入する。AI・自動運転等の新技術を活用する「地域社会DX」と、医療・福祉・商業施設を集約し公共交通で結ぶ「コンパクト・プラス・ネットワーク」型都市構造への再編が並行して進められている。\n\n### 読み解きのコツ\n\n地域経済を評価する際は、「県内総生産（GDP）」と「県民所得」を混同しないことが重要である。GDPは「県内で生み出された付加価値」、県民所得は「県の居住者が受け取った所得（県外勤務分も含む）」を指す。ベッドタウン県ではGDPは小さくても県民所得は高く、逆に大都市近郊の工業県ではGDPが大きくても本社が東京にあるため法人税収は流出する。47都道府県を横並びで比較するときは、「人口1人当たり」で揃え、税収・所得・産業構造の3つを必ずセットで見ることが、データの読み解きとして本質的である。",
        "sources": [
          {
            "label": "経済財政白書 (令和7年版)",
            "url": "https://www5.cao.go.jp/keizai3/whitepaper.html"
          },
          {
            "label": "中小企業白書 (2024年版)",
            "url": "https://www.chusho.meti.go.jp/pamflet/hakusyo/index.html"
          },
          {
            "label": "地方財政白書 (令和8年版)",
            "url": "https://www.soumu.go.jp/menu_seisaku/hakusyo/index.html"
          },
          {
            "label": "男女共同参画白書 (令和7年版)",
            "url": "https://www.gender.go.jp/about_danjo/whitepaper/index.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          }
        ]
      },
      "sourceName": "経済財政白書 (令和7年版) / 中小企業白書 (2024年版) / 地方財政白書 (令和8年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 10
    },
    {
      "componentKey": "md-local-economy-related-topics",
      "componentType": "markdown-section",
      "title": "関連トピック・中長期課題",
      "componentProps": {
        "subtitle": "地方創生2.0からGX・DXまで",
        "markdown": "地域経済は人口減少・産業構造転換・脱炭素対応・財政制約が連動する複合課題である。各種白書から、特に重要度の高い5つの論点を整理する。\n\n### 1. 人口減少と労働力供給の制約\n\n2024年の総人口1億2,380万人は、2056年に1億人を割り、2070年には約8,700万人まで減少すると推計される。生産年齢人口（15〜64歳）は2020年の7,509万人から2040年には6,213万人へ減り、毎年約60万人ペースの減少となる。景況感に関わらず人材が不足する「長期的かつ粘着的な人手不足」が常態化し、地方公共団体でも2045年には地方公務員の充足率が全国平均で8割程度に低下するとの推計がある。\n\n### 2. 産業構造転換 — GX・DX・スタートアップ\n\n**GX2040ビジョン**は2025年2月に閣議決定され、今後10年間で150兆円超の官民投資を目指す。20兆円規模のGX経済移行債で先行投資を支援し、脱炭素電源が豊富な地方へデータセンター等を分散立地させる「ワット・ビット連携（地域GX）」を推進する。\n\n**DX**では、自治体情報システムの標準化を2025年度（一部2030年度まで猶予）までに進め、デジタル基盤改革支援基金に累計7,742億円を計上。\n\n**スタートアップ**では、「スタートアップ育成5か年計画」に基づき、2024年度のSBIR制度（スタートアップ等への補助金）支出目標額を約1,406億円に設定している。\n\n### 3. 中小企業の生産性向上\n\n地域雇用の約7割を支える中小企業の「稼ぐ力」向上が、持続的賃上げの前提となる。2020〜2024年度の主要4補助金（事業再構築・IT導入・ものづくり・持続化）は累計約4兆円規模で実施された。ただし中小企業のソフトウェア装備率は大企業の約0.05〜0.07倍と極めて低く、これが労働生産性向上の最大のボトルネックとなっている。\n\n### 4. 社会保障費の地域財政への圧迫\n\n社会保障給付費は2024年度予算ベースで137.8兆円（対GDP比22.4%）に達し、うち地方負担分は約17兆円。介護保険費用は2023年度の11.7兆円から2040年度には約25.8兆円まで膨らむ試算である。さらに令和6年度の公立病院事業経常収支は3,952億円の赤字と過去最大を更新しており、自治体財政を直接圧迫している。\n\n### 5. 地方創生2.0と「人の流れ」の創出\n\n2025年度地方財政計画では旧デジタル田園都市国家構想事業費を改組した「新しい地方経済・生活環境創生事業費」1.2兆円（地方創生推進費1兆円 + 地域デジタル社会推進費2,000億円）を計上。令和8年度には「地域未来基金費」4,000億円を新規計上した。また2024年11月施行の改正法に基づき、二地域居住の促進や「特定居住支援法人」育成、令和8年度中の「ふるさと住民登録制度」創設など、関係人口の拡大策が進められている。",
        "sources": [
          {
            "label": "経済財政白書 (令和7年版)",
            "url": "https://www5.cao.go.jp/keizai3/whitepaper.html"
          },
          {
            "label": "中小企業白書 (2024年版)",
            "url": "https://www.chusho.meti.go.jp/pamflet/hakusyo/index.html"
          },
          {
            "label": "地方財政白書 (令和8年版)",
            "url": "https://www.soumu.go.jp/menu_seisaku/hakusyo/index.html"
          },
          {
            "label": "情報通信白書 (令和7年版)",
            "url": "https://www.soumu.go.jp/johotsusintokei/whitepaper/index.html"
          },
          {
            "label": "国土交通白書 2025",
            "url": "https://www.mlit.go.jp/hakusyo/mlit/index.html"
          }
        ]
      },
      "sourceName": "経済財政白書 (令和7年版) / 中小企業白書 (2024年版) / 地方財政白書 (令和8年版) / 情報通信白書 (令和7年版) / 国土交通白書 2025",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 20
    },
    {
      "componentKey": "md-local-economy-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "subtitle": "地域経済について読者が気になる 7 問",
        "markdown": "### Q1: 「地域経済」とは何を指す?\n\n地域経済とは、個々の地方公共団体（都道府県・市区町村）が、自然条件・歴史・産業構造・人口規模に応じて営む経済活動の集合体を指す。地方政府は国内総生産（GDP）の10.8%（69.7兆円）を占める巨大な経済主体で、中央政府（4.6%）の約2.3倍の最終支出を行っている。住民の交通・買い物・医療福祉等の生活サービスを支える基盤である。(出典: 地方財政白書 令和8年版)\n\n### Q2: 「県民所得」と「GDP（県内総生産）」は何が違う?\n\nGDP（県内総生産）はその地域内で一定期間に生み出された付加価値の総額。県民所得はその地域の居住者が受け取った所得の総額（県外勤務分など地域外からの所得も含む）。日本全体の名目GDPは2024年度に初めて600兆円を突破（617.0兆円）して過去最高を更新した。ベッドタウン県ではGDPは小さくても県民所得は高くなる傾向があるため、両者は使い分けが必要である。(出典: 経済財政白書 令和7年版)\n\n### Q3: 東京一極集中はなぜ続く?\n\n最大の要因は若年層（10代後半〜20代）の進学と就職である。大学進学率は東京都77.6%に対し宮崎県は38.7%と倍以上の格差があり、進学を機に東京圏へ流入する。賃金格差も大きく、所定内給与（女性）は東京都33.8万円が全国最高。女性は男性に比べ東京圏に留まる傾向が強く、地方に残る「固定的な性別役割分担意識」や閉塞感から逃れたいという心理的要因も指摘されている。(出典: 男女共同参画白書 令和7年版)\n\n### Q4: 地方は有効求人倍率が高いのに、なぜ人が集まらない?\n\n労働需要（求人）と供給（求職者）の深刻なミスマッチが原因である。2024年の全職業計の有効求人倍率1.22倍に対し、保安職業6.91倍・建設採掘5.72倍と人手不足が極端な職種では、賃金上昇率が平均を下回っていることが多く、過酷な労働環境に見合う処遇が得られにくい。地方の中小企業は大企業に比べ価格転嫁・生産性向上の取組が遅れており、賃上げ原資を確保できていない実態が背景にある。(出典: 経済財政白書 令和7年版)\n\n### Q5: 「地方創生」と「地方創生2.0」は何が違う?\n\n2014年開始の従来「地方創生」は、人口減少の克服と東京一極集中の是正を掲げてきた。2024年10月始動の「地方創生2.0」は「地方こそ成長の主役」との発想に立ち、人口が減っても経済成長を維持する「適応策」を重視する。AI・自動運転等の新技術活用（地域社会DX）、自治体間の広域連携、若者・女性から選ばれる地域づくりに集中的に取り組む。令和8年度地方財政計画では「地域未来基金費」4,000億円が新規計上された。(出典: 情報通信白書 令和7年版)\n\n### Q6: 財政力指数が低い地域はどうなる?\n\n財政力指数（基準財政収入額÷基準財政需要額）が低い地域は、自前の税収だけでは行政サービスを賄えず、地方交付税（国からの財源移転）への依存度が高まる。人口1人当たり税収額は東京都（指数167.3）に対し長崎県（70.3）と約2.4倍の格差があり、法人関係二税では最大5.8倍。財政力が弱い自治体ではインフラ老朽化対応やデジタル人材確保が困難になる「供給制約」が顕在化している。(出典: 地方財政白書 令和8年版)\n\n### Q7: 地方経済を立て直す方法は?\n\n白書は3つの戦略を提唱する。(1)「稼ぐ力」の強化 — デジタル技術で人手不足を克服し、脱炭素投資（GX）でエネルギーの地産地消と新規産業を創出する。(2) 地域循環共生圏の構築 — 地域の自然資本（再エネ・森林等）を持続的に活用し、環境・経済・社会の課題を同時解決する事業を生む。(3) 人の流れの創出 — 移住者だけでなく継続的に地域に関わる「関係人口」を拡大し、令和8年度中に「ふるさと住民登録制度」を創設、二地域居住を促進する。(出典: 環境白書 令和7年版 / 国土交通白書 2025)",
        "sources": [
          {
            "label": "経済財政白書 (令和7年版)",
            "url": "https://www5.cao.go.jp/keizai3/whitepaper.html"
          },
          {
            "label": "中小企業白書 (2024年版)",
            "url": "https://www.chusho.meti.go.jp/pamflet/hakusyo/index.html"
          },
          {
            "label": "地方財政白書 (令和8年版)",
            "url": "https://www.soumu.go.jp/menu_seisaku/hakusyo/index.html"
          },
          {
            "label": "情報通信白書 (令和7年版)",
            "url": "https://www.soumu.go.jp/johotsusintokei/whitepaper/index.html"
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
            "label": "環境白書 (令和7年版)",
            "url": "https://www.env.go.jp/policy/hakusyo/index.html"
          }
        ]
      },
      "sourceName": "経済財政白書 (令和7年版) / 中小企業白書 (2024年版) / 地方財政白書 (令和8年版) / 情報通信白書 (令和7年版) / 男女共同参画白書 (令和7年版) / 国土交通白書 2025 / 環境白書 (令和7年版)",
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "考察",
      "sortOrder": 30
    },
    {
      "componentKey": "theme-le-establishments-trend",
      "componentType": "line-chart",
      "title": "全産業事業所数の推移",
      "componentProps": {
        "estatParams": [
          {
            "statsDataId": "0000010103",
            "cdCat01": "C2107"
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
      "sourceLink": null,
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": null,
      "sortOrder": 20
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
  ]
};
