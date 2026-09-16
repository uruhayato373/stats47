import type { ThemeCatalog } from "./types";

export const HEALTHCARE_CATALOG: ThemeCatalog = {
  "key": "healthcare",
  "title": "医療・健康",
  "description": "医療資源の供給、入院利用と費用、健康アウトカムの違いを順に把握する。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "physicians-in-medical-facilities-per-100k",
      "shortLabel": "医師数（人口10万人当たり）",
      "role": "primary",
      "selection": {
        "proposedBy": "医師・歯科医師・薬剤師統計 平成18(2006)年 結果の概要 3-2-4「都道府県(従業地)別にみた人口10万対医師数」（厚生労働省）",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/ishi/06/kekka1-2-4.html",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省の医師・歯科医師・薬剤師統計は、人口10万対医師数を全国値と都道府県別値の両方で継続的に公表しており、経年比較・地域比較の基準指標として扱われている。医療人材の供給という章の冒頭で示す代表指標として適しており、読者が「自分の地域に医師はどれだけいるか」を最初に確認する起点になる。",
        "adoptionCriteria": ["representativeness", "comparability", "readerValue"],
        "readerQuestion": "自分の都道府県には人口あたりでどれくらいの医師がいるのか。",
        "targetReaderOrDecision": "医療提供体制の地域差を把握したい住民・自治体担当者。"
      }
    },
    {
      "rankingKey": "nurses-in-medical-facilities-per-100k",
      "shortLabel": "看護師・准看護師数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "看護職員確保対策（看護師等の確保を促進するための措置に関する基本的指針の紹介ページ）（厚生労働省）",
        "sourceUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000095525.html",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省は看護師等の人材確保の促進に関する法律に基づく基本指針で、看護師等の確保を良質かつ適切な医療提供の前提条件として明示している。医師数だけでは捉えられない病床運営の実働人員という角度を補い、医師数と対にして地域の医療人材の厚みを示す補完的指標になる。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "医師だけでなく看護師の配置も地域によって十分なのか。",
        "targetReaderOrDecision": "医療人材確保の政策担当者・就業先を検討する看護職。"
      }
    },
    {
      "rankingKey": "general-hospital-count-per-100k",
      "shortLabel": "一般病院数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和4年医療施設調査・病院報告の概況（千葉県健康福祉部健康福祉指導課、令和4年）",
        "sourceUrl": "https://www.pref.chiba.lg.jp/kenshidou/toukeidata/kakushukousei/r04-shisetsu.html",
        "surveyedAt": "2026-09-16",
        "rationale": "医療施設調査に基づくこの概況資料は、人口10万人当たりの病院数を都道府県順位（最高17.8、最低3.6）とともに示しており、人口規模の異なる都道府県間で入院医療を担う施設の密度を比較する基準として位置付けている。医療人材と施設の章で「医療資源の供給」をまず把握するための出発点となる指標である。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の都道府県には人口当たりどれくらいの病院があるのか。",
        "targetReaderOrDecision": "地域の入院医療インフラの充実度を把握したい住民・自治体担当者。"
      }
    },
    {
      "rankingKey": "general-hospital-bed-count-per-100k",
      "shortLabel": "一般病院病床数（人口10万人当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和4年医療施設調査・病院報告の概況（千葉県健康福祉部健康福祉指導課、令和4年）",
        "sourceUrl": "https://www.pref.chiba.lg.jp/kenshidou/toukeidata/kakushukousei/r04-shisetsu.html",
        "surveyedAt": "2026-09-16",
        "rationale": "同資料は病床数を人口10万人当たりで示し、都道府県順位（最高2328.1、最低798.9）を併記することで、病院数だけでは捉えきれない収容力の地域差を明らかにしている。病院数と病床数を対にして見ることで、施設の「数」と「規模」の両面から医療供給を評価できる点が、病院数指標を補完する。",
        "adoptionCriteria": ["comparability", "complementarity"],
        "readerQuestion": "病院の数は同程度でも、実際に入院できる病床はどれだけ確保されているのか。",
        "targetReaderOrDecision": "地域医療計画の担当者や病床整備の議論をする自治体職員。"
      }
    },
    {
      "rankingKey": "pharmacy-count-per-100k",
      "shortLabel": "薬局数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした人口10万人あたり薬局数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "national-medical-expense-per-person",
      "shortLabel": "1人当たり国民医療費",
      "role": "secondary",
      "selection": {
        "proposedBy": "医療費の地域差分析（厚生労働省保険局）",
        "sourceUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/database/iryomap/index.html",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省は都道府県別の1人当たり医療費を年齢構成の違いを補正した地域差指数として毎年公表しており、医療費水準の地域比較の公式な物差しとして位置づけている。1人当たり国民医療費はこの地域差指数の基礎データであり、医療費章で地域間の負担差を示す代表指標として適している。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の都道府県の1人当たり医療費は全国平均と比べて高いのか低いのか。",
        "targetReaderOrDecision": "医療費の地域差を確認したい住民・保険者・自治体担当者。"
      }
    },
    {
      "rankingKey": "general-hospital-avg-length-of-stay",
      "shortLabel": "一般病院の平均在院日数",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和4年医療施設調査・病院報告の概況（千葉県健康福祉部健康福祉指導課、令和4年）",
        "sourceUrl": "https://www.pref.chiba.lg.jp/kenshidou/toukeidata/kakushukousei/r04-shisetsu.html",
        "surveyedAt": "2026-09-16",
        "rationale": "この資料は平均在院日数を病床種類別・都道府県順位付きで公表しており、病床数や病院数という「供給量」だけでなく、実際の入院利用の効率性・回転率を示す別角度の指標として位置付けている。病床利用率と対になることで、供給と利用を分けて把握するという章立ての狙いに直結する。",
        "adoptionCriteria": ["comparability", "complementarity", "dataQuality"],
        "readerQuestion": "自分の地域の病院は全国平均に比べて入院が長引きやすいのか、それとも早く退院できるのか。",
        "targetReaderOrDecision": "入院医療の効率性を比較したい研究者・医療政策担当者。"
      }
    },
    {
      "rankingKey": "general-hospital-bed-occupancy-rate",
      "shortLabel": "病床利用率",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ「社会生活統計指標」I 健康・医療（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010209",
        "surveyedAt": "2026-09-16",
        "rationale": "総務省統計局の社会・人口統計体系は、都道府県別の医療提供体制を横断比較するための指標群としてI10104「一般病院病床利用率」を1975年度から継続収録しており、病床が地域でどの程度埋まっているかを示す代表的な供給利用指標として位置付けている。テーマ「入院の供給と利用」で病床数・平均在院日数と組み合わせて読むことで、供給量だけでなく実際の稼働状況を都道府県間で比較できる。",
        "adoptionCriteria": ["representativeness", "comparability", "dataQuality"]
      }
    },
    {
      "rankingKey": "deaths-lifestyle-diseases-per-100k",
      "shortLabel": "生活習慣病死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ「社会生活統計指標」I 健康・医療（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010209",
        "surveyedAt": "2026-09-16",
        "rationale": "同じ社会・人口統計体系の都道府県データはI06101「生活習慣病による死亡者数（人口10万人当たり）」を1975年度から収録しており、人口動態統計を都道府県間で比較可能な形に整えた死因別死亡の代表指標として扱われている。テーマの「主要死因による死亡」の章で、地域の健康アウトカムの違いを把握する中心指標として機能する。",
        "adoptionCriteria": ["representativeness", "comparability", "dataQuality"]
      }
    },
    {
      "rankingKey": "deaths-diabetes-per-100k",
      "shortLabel": "糖尿病死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした糖尿病による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-malignant-neoplasms-per-100k",
      "shortLabel": "悪性新生物死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした腫瘍による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-heart-disease-excl-hypertensive-per-100k",
      "shortLabel": "心疾患（高血圧性を除く）死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした心疾患による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-cerebrovascular-disease-per-100k",
      "shortLabel": "脳血管疾患死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした脳血管疾患による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "deaths-hypertensive-diseases-per-100k",
      "shortLabel": "高血圧性疾患死亡（日本人人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "日本人人口10万人を基準にした高血圧性疾患による死亡者数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "psychiatric-hospital-count-per-100k",
      "shortLabel": "精神科病院数（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I",
        "surveyedAt": "2026-09-08",
        "rationale": "人口10万人を基準にした精神科病院数として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "treatment-rate-mood-disorder-outpatient",
      "shortLabel": "気分障害の外来受療率（人口10万人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "令和5年患者調査 全国編Z5-2 第5-2表「受療率（人口10万対）の年次推移，入院－外来×傷病分類別」（厚生労働省）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004025892",
        "surveyedAt": "2026-09-16",
        "rationale": "厚生労働省の患者調査は傷病分類別受療率の再掲項目として「気分［感情］障害（躁うつ病を含む）」を入院・外来別に区分して長期時系列で公表しており、精神疾患の中でも特にうつ病を含む気分障害の外来受療動向を他の傷病と同一基準で追える構成になっている。テーマの「こころの状態と相談・受療」の章で、医療機関を実際に利用している患者側の規模を示す指標として、供給側指標（医師数や病床）を補完する役割を持つ。",
        "adoptionCriteria": ["representativeness", "complementarity", "comparability"]
      }
    },
    {
      "rankingKey": "healthy-life-expectancy-male",
      "shortLabel": "健康寿命（男性）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版高齢社会白書 第1章第2節2「健康・福祉」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_2_2.html",
        "surveyedAt": "2026-09-16",
        "rationale": "高齢社会白書は健康寿命を「健康上の問題で日常生活に制限のない期間」と定義し、国民生活基礎調査を用いたサリバン法により男女別に算出した全国値を平均寿命の延びと対比させて掲載している。男性の健康寿命は平均寿命との差（不健康期間）を測る基礎となる数値であり、テーマの「健康に生活できる期間」の章で、都道府県別の健康寿命を読み解く際の定義的な裏付けになる。",
        "adoptionCriteria": ["representativeness", "readerValue"]
      }
    },
    {
      "rankingKey": "healthy-life-expectancy-female",
      "shortLabel": "健康寿命（女性）",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版高齢社会白書 第1章第2節2「健康・福祉」（内閣府）",
        "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_2_2.html",
        "surveyedAt": "2026-09-16",
        "rationale": "同白書は女性の健康寿命についても男性と並置して示しており、平均寿命の延び（女性1.15年）を上回る健康寿命の延び（女性1.76年）という形で、単なる長寿化ではなく健康に生活できる期間そのものの伸びを評価している。テーマの「健康寿命と平均寿命」の章で、男女差・都道府県差を語る際の全国基準値として女性の健康寿命を単独で扱う根拠になる。",
        "adoptionCriteria": ["representativeness", "readerValue", "complementarity"]
      }
    },
    {
      "rankingKey": "ambulance-hospital-arrival-time",
      "shortLabel": "救急搬送の病院収容所要時間",
      "role": "secondary",
      "selection": {
        "proposedBy": "令和6年版 消防白書 第2章第5節「1．救急業務の実施状況」（総務省消防庁）",
        "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r6/chapter2/section5/68130.html",
        "surveyedAt": "2026-09-16",
        "rationale": "消防白書は病院収容所要時間を「119番通報を受けてから医師に引き継ぐまでに要した時間」と定義し、全国平均の年次推移をコロナ禍前との比較で示すことで、救急搬送の迅速性が経年で悪化しているかを継続的に監視する指標として位置付けている。テーマの「救急搬送の所要時間と初診時の傷病程度」の章で、地域の医療アクセスの実態を利用者側の体感時間として示す指標になる。",
        "adoptionCriteria": ["representativeness", "readerValue", "dataQuality"]
      }
    },
    {
      "rankingKey": "infant-deaths",
      "shortLabel": "乳児死亡数",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-14",
        "rationale": "実数は小標本で年次変動が大きいため、乳児死亡率と分けて背景指標として詳細索引に保持する。"
      }
    },
    {
      "rankingKey": "infant-mortality-rate-per-1000-births",
      "shortLabel": "乳児死亡率",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-14",
        "rationale": "出生千対の率を複数年推移・出生数と合わせて読む背景指標として詳細索引に保持する。"
      }
    },
    {
      "rankingKey": "average-life-expectancy-female-20",
      "shortLabel": "平均余命（女性20歳時点）",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-14",
        "rationale": "健康寿命(女性)と対にして生涯の平均余命を読む背景指標として詳細索引に保持する。"
      }
    },
    {
      "rankingKey": "average-life-expectancy-female-65",
      "shortLabel": "平均余命（女性65歳時点）",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.mhlw.go.jp/toukei/list/81-1.html",
        "surveyedAt": "2026-09-14",
        "rationale": "高齢期の平均余命を出生時系列と区別し、医療・生活条件の背景指標として詳細索引に保持する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-health-supply-trend",
      "componentType": "line-chart",
      "title": "医療施設の医師数の推移（人口10万人当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "physicians-in-medical-facilities-per-100k",
            "label": "医師数（人口10万人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "physicians-in-medical-facilities-per-100k"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "annotation": "医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。",
      "section": "supply"
    },
    {
      "componentKey": "theme-health-supply-trend-hospitals",
      "componentType": "line-chart",
      "title": "一般病院数の推移（人口10万人当たり）",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "general-hospital-count-per-100k",
            "label": "一般病院数（人口10万人当たり）",
            "colorRole": "series-1"
          }
        ]
      },
      "relatedRankingKeys": [
        "general-hospital-count-per-100k"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 20,
      "annotation": "総人口10万人当たりの一般病院数です。施設の規模や診療機能の違いは含まれません。",
      "section": "supply"
    },
    {
      "componentKey": "theme-health-expense-trend",
      "componentType": "line-chart",
      "title": "1人当たり医療費の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "national-medical-expense-per-person",
            "label": "1人当たり国民医療費"
          }
        ],
        "labels": [
          "1人当たり国民医療費"
        ],
        "seriesColors": [
          "danger"
        ]
      },
      "relatedRankingKeys": [
        "national-medical-expense-per-person"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "medical-expense",
      "sortOrder": 30
    },
    {
      "componentKey": "md-healthcare-discussion",
      "componentType": "markdown-section",
      "title": "数値を比較するときの注意",
      "componentProps": {
        "markdown": "医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。\n\n人口10万人当たり病床数、病床利用率、在院日数は別の側面です。値の大小だけで医療の質は判断できません。\n\n1人当たりの医療費は年齢構成や受療状況の影響を受けます。"
      },
      "sourceName": "厚生労働白書 (令和7年版) / 地方財政白書 (令和8年版) / 経済財政白書 (令和7年版) / 地域医療構想・病床機能報告 (厚生労働省) / 医師の働き方改革 (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 40
    },
    {
      "componentKey": "md-healthcare-faq",
      "componentType": "markdown-section",
      "title": "よくある質問",
      "componentProps": {
        "displayMode": "faq",
        "markdown": "### Q1: 医療人材と施設を見るときの注意は？\n\n医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。\n\n### Q2: このテーマの数値を比較するときの注意は？\n\n供給・利用・費用・健康結果を分けて読み、単一指標から医療の良し悪しを決めないようにします。"
      },
      "sourceName": "厚生労働白書 (令和7年版) / 地域医療構想 (厚生労働省) / 医師の働き方改革 (厚生労働省) / 健康日本21(第三次) (厚生労働省)",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "reading",
      "sortOrder": 50
    },
    {
      "componentKey": "theme-health-death-causes-donut",
      "componentType": "donut-chart",
      "title": "主要5死因内の構成",
      "componentProps": {
        "topN": 5,
        "seriesRefs": [
          {
            "metricKey": "deaths-malignant-neoplasms-per-100k",
            "label": "悪性新生物死亡（日本人人口10万人当たり）",
            "colorRole": "danger"
          },
          {
            "metricKey": "deaths-heart-disease-excl-hypertensive-per-100k",
            "label": "心疾患（高血圧性を除く）死亡（日本人人口10万人当たり）",
            "colorRole": "population"
          },
          {
            "metricKey": "deaths-cerebrovascular-disease-per-100k",
            "label": "脳血管疾患死亡（日本人人口10万人当たり）",
            "colorRole": "count"
          },
          {
            "metricKey": "deaths-diabetes-per-100k",
            "label": "糖尿病死亡（日本人人口10万人当たり）",
            "colorRole": "improve"
          },
          {
            "metricKey": "deaths-hypertensive-diseases-per-100k",
            "label": "高血圧性疾患死亡（日本人人口10万人当たり）",
            "colorRole": "special"
          }
        ]
      },
      "relatedRankingKeys": [
        "deaths-malignant-neoplasms-per-100k",
        "deaths-heart-disease-excl-hypertensive-per-100k",
        "deaths-cerebrovascular-disease-per-100k",
        "deaths-diabetes-per-100k",
        "deaths-hypertensive-diseases-per-100k"
      ],
      "sourceName": "総務省統計局 社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "causes-of-death",
      "sortOrder": 60,
      "annotation": "日本人人口10万人当たりの死亡率を使い、同じ地域・年の5死因の合計を100%として示します。各数値は死亡者の実人数ではありません。全死因の構成比や年齢調整死亡率ではありません。"
    }
  ],
  "evidenceTopics": [
    {
      "key": "physician-distribution",
      "lensKey": "service-capacity",
      "title": "医師の地域偏在と医療供給",
      "question": "人口10万人当たりの医療施設従事医師数は、都道府県間でどう異なるか",
      "summary": "医療施設の医師・看護師等・一般病院を人口10万人当たりで確認し、単一指標だけで医療体制全体を判断しません。",
      "sourceKeys": [
        "mhlw-physician-workforce-plan"
      ],
      "relatedRankingKeys": [
        "physicians-in-medical-facilities-per-100k",
        "nurses-in-medical-facilities-per-100k",
        "general-hospital-count-per-100k"
      ],
      "relatedChartKeys": [
        "theme-health-supply-trend"
      ]
    },
    {
      "key": "inpatient-capacity-and-use",
      "lensKey": "participation",
      "title": "病床の供給と利用",
      "question": "病床数・病床利用率・平均在院日数は、入院医療の供給と利用をどう分けて示すか",
      "summary": "人口10万人当たり病床数は人口規模に対する供給、利用率は稼働状況、平均在院日数は利用期間として別々に読みます。",
      "sourceKeys": [
        "mhlw-regional-healthcare-vision",
        "mhlw-hospital-function-report-2025"
      ],
      "relatedRankingKeys": [
        "general-hospital-bed-count-per-100k",
        "general-hospital-bed-occupancy-rate",
        "general-hospital-avg-length-of-stay"
      ]
    }
  ],
  "keywords": [
    "医師数",
    "病院数",
    "医療費",
    "医療格差",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "supply",
      "title": "医療人材と施設",
      "description": "医師・看護師・准看護師・一般病院を人口10万人当たりで比較します。医療人材は医療施設の従事者が対象です。",
      "metricGroupKeys": [
        "supply-1",
        "supply-2"
      ],
      "chartKeys": [
        "theme-health-supply-trend",
        "theme-health-supply-trend-hospitals"
      ]
    },
    {
      "key": "hospital-use",
      "title": "入院の供給と利用",
      "description": "人口10万人当たり病床数、病床利用率、平均在院日数は別の側面です。値の大小だけで医療の質は判断できません。",
      "metricGroupKeys": [
        "hospital-use-1",
        "hospital-use-2",
        "hospital-use-3"
      ],
      "chartKeys": []
    },
    {
      "key": "medical-expense",
      "title": "医療費",
      "description": "1人当たりの医療費は年齢構成や受療状況の影響を受けます。",
      "metricGroupKeys": [
        "medical-expense"
      ],
      "chartKeys": [
        "theme-health-expense-trend"
      ]
    },
    {
      "key": "causes-of-death",
      "title": "主要死因による死亡",
      "description": "日本人人口10万人当たりの死亡率を使い、同じ地域・年の5死因の合計を100%として示します。各数値は死亡者の実人数ではありません。全死因の構成比や年齢調整死亡率ではありません。",
      "metricGroupKeys": [],
      "chartKeys": [
        "theme-health-death-causes-donut"
      ]
    },
    {
      "key": "healthy-years",
      "title": "健康に生活できる期間",
      "description": "日常生活に制限のない期間の平均を男女別に確認します。推計値のため小さな県差を過度に読み取らないでください。",
      "metricGroupKeys": [
        "healthy-years"
      ],
      "chartKeys": []
    },
    {
      "key": "access",
      "title": "地域の医療アクセス",
      "description": "救急搬送時間は119番通報から医師への引継ぎまでの時間です。現場到着時間や地図の推定移動時間とは異なります。",
      "metricGroupKeys": [
        "access"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "depopulation-medical"
      ]
    },
    {
      "key": "reading",
      "title": "読み方",
      "description": "供給・利用・費用・健康結果を分けて読み、単一指標から医療の良し悪しを決めないようにします。",
      "metricGroupKeys": [],
      "chartKeys": [
        "md-healthcare-discussion",
        "md-healthcare-faq"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "supply-1",
      "title": "医師・看護師等（人口10万人当たり）",
      "rankingKeys": [
        "physicians-in-medical-facilities-per-100k",
        "nurses-in-medical-facilities-per-100k"
      ],
      "defaultCheckedKeys": [
        "physicians-in-medical-facilities-per-100k",
        "nurses-in-medical-facilities-per-100k"
      ]
    },
    {
      "key": "supply-2",
      "title": "一般病院数（人口10万人当たり）",
      "rankingKeys": [
        "general-hospital-count-per-100k"
      ],
      "defaultCheckedKeys": [
        "general-hospital-count-per-100k"
      ]
    },
    {
      "key": "hospital-use-1",
      "title": "一般病院病床数（人口10万人当たり）",
      "rankingKeys": [
        "general-hospital-bed-count-per-100k"
      ],
      "defaultCheckedKeys": [
        "general-hospital-bed-count-per-100k"
      ]
    },
    {
      "key": "hospital-use-2",
      "title": "病床利用率",
      "rankingKeys": [
        "general-hospital-bed-occupancy-rate"
      ],
      "defaultCheckedKeys": [
        "general-hospital-bed-occupancy-rate"
      ]
    },
    {
      "key": "hospital-use-3",
      "title": "一般病院の平均在院日数",
      "rankingKeys": [
        "general-hospital-avg-length-of-stay"
      ],
      "defaultCheckedKeys": [
        "general-hospital-avg-length-of-stay"
      ]
    },
    {
      "key": "medical-expense",
      "title": "1人当たり国民医療費",
      "rankingKeys": [
        "national-medical-expense-per-person"
      ],
      "defaultCheckedKeys": [
        "national-medical-expense-per-person"
      ]
    },
    {
      "key": "healthy-years",
      "title": "健康に生活できる期間",
      "rankingKeys": [
        "healthy-life-expectancy-male",
        "healthy-life-expectancy-female"
      ],
      "defaultCheckedKeys": [
        "healthy-life-expectancy-male",
        "healthy-life-expectancy-female"
      ]
    },
    {
      "key": "access",
      "title": "地域の医療アクセス",
      "rankingKeys": [
        "ambulance-hospital-arrival-time"
      ],
      "defaultCheckedKeys": [
        "ambulance-hospital-arrival-time"
      ]
    }
  ]
};
