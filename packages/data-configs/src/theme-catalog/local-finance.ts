import type { ThemeCatalog } from "./types";

export const LOCAL_FINANCE_CATALOG: ThemeCatalog = {
  "key": "local-finance",
  "title": "地方財政",
  "description": "都道府県の歳入歳出、財政の弾力性、現在と将来の負担を決算年度付きで把握する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "primary",
      "selection": {
        "proposedBy": "財政用語の解説「財政力指数」（長泉町公式サイト）",
        "sourceUrl": "https://www.town.nagaizumi.lg.jp/soshiki/kikaku/4/1631.html",
        "surveyedAt": "2026-09-16",
        "rationale": "地方公共団体の財政運営を語るうえで、自主的な税収でどこまで標準的な行政需要を賄えるかを示すこの指数は最も基本的な出発点であり、地方交付税に頼る度合いという地域差を1つの数値に集約できる。都道府県間の財源基盤の違いを比較する章の中心指標として、他の収支・負担指標を読み解く前提を与える。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の都道府県は自前の税収でどれだけ標準的な行政サービスを賄えているか。",
        "targetReaderOrDecision": "都道府県間の財源基盤の違いを比較したい読者。"
      }
    },
    {
      "rankingKey": "current-balance-ratio",
      "shortLabel": "経常収支比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "財政用語の解説「経常収支比率」（長泉町公式サイト）",
        "sourceUrl": "https://www.town.nagaizumi.lg.jp/soshiki/kikaku/4/1631.html",
        "surveyedAt": "2026-09-16",
        "rationale": "この指標は財源が義務的経費で固定化されている度合い、すなわち政策的な自由度をどれだけ残せているかを測るものであり、財政力指数が示す財源の量とは別の角度から財政運営の余裕を評価できる。硬直度が高いほど新規施策や緊急対応に回せる一般財源が乏しいことを示すため、財政運営の余裕と負担を扱う章で財政力指数を補完する役割を持つ。",
        "adoptionCriteria": ["complementarity", "comparability"],
        "readerQuestion": "経常的な支出に一般財源がどれだけ縛られており、政策的に自由に使える余地がどれくらい残っているか。",
        "targetReaderOrDecision": "財政運営の弾力性・硬直化の程度を都道府県間で比較したい読者。"
      }
    },
    {
      "rankingKey": "real-public-debt-service-ratio",
      "shortLabel": "実質公債費比率",
      "role": "primary",
      "selection": {
        "proposedBy": "健全化判断比率の説明「実質公債費比率」（大阪市公式サイト）",
        "sourceUrl": "https://www.city.osaka.lg.jp/zaisei/page/0000661357.html",
        "surveyedAt": "2026-09-16",
        "rationale": "地方公共団体の財政健全化法に基づく4指標の一つであり、単年度の借入返済負担が財政規模に対してどれだけ重いかを公営企業や特別会計への繰出しまで含めて捉える点で、単純な起債残高だけでは見えない現在の負担の実態を示す。現在の負担を扱う章で、将来負担比率と対をなす指標として位置付けられる。",
        "adoptionCriteria": ["representativeness", "dataQuality"],
        "readerQuestion": "自分の都道府県は毎年度の借金返済の負担がどれだけ財政規模に対して重いか。",
        "targetReaderOrDecision": "現在の公債費負担の重さを都道府県間で比較したい読者。"
      }
    },
    {
      "rankingKey": "future-burden-ratio",
      "shortLabel": "将来負担比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "健全化判断比率の説明「将来負担比率」（大阪市公式サイト）",
        "sourceUrl": "https://www.city.osaka.lg.jp/zaisei/page/0000661357.html",
        "surveyedAt": "2026-09-16",
        "rationale": "実質公債費比率が単年度の返済負担を示すのに対し、この指標は地方公社や第三セクターの損失補償まで含めた将来にわたる潜在的負債の残高を捉えるものであり、現在と将来の負担を区別して把握するというテーマの目的に直結する。財政健全化法の4指標の一つとして、都道府県間で共通の基準に基づき算定されるため比較可能性も高い。",
        "adoptionCriteria": ["representativeness", "comparability", "complementarity"],
        "readerQuestion": "自分の都道府県は将来にわたってどれだけの潜在的な負債を抱えているか。",
        "targetReaderOrDecision": "将来世代への負担の大きさを都道府県間で比較したい読者。"
      }
    },
    {
      "rankingKey": "real-balance-ratio",
      "shortLabel": "実質収支比率",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "実質収支比率は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "local-tax-ratio-pref-finance",
      "shortLabel": "地方税割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "地方税割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "local-allocation-tax-ratio-pref-finance",
      "shortLabel": "交付税割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "交付税割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "national-treasury-disbursement-ratio-pref-finance",
      "shortLabel": "国庫支出金割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "国庫支出金割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "self-financing-ratio",
      "shortLabel": "自主財源割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "自主財源割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "per-capita-total-expenditure-pref-municipal",
      "shortLabel": "歳出決算総額（人口1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/D",
        "surveyedAt": "2026-09-08",
        "rationale": "人口1人を基準にした歳出決算総額として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "personnel-expenditure-ratio-pref-finance",
      "shortLabel": "人件費割合",
      "role": "context",
      "selection": {
        "proposedBy": "財政用語の解説「人件費」（富山市公式ウェブサイト）",
        "sourceUrl": "https://www.city.toyama.lg.jp/shisei/yosan/1010829/1003118.html",
        "surveyedAt": "2026-09-16",
        "rationale": "人件費は性質別歳出の中で義務的経費の柱の一つであり、経常収支比率を押し上げる主要因でもあるため、歳出決算総額に占める人件費の割合を見ることで、財政の硬直化の内訳を職員給与や議員報酬といった具体的な支出項目に分解して確認できる。性質別歳出を分けて見る章で、経常収支比率の内実を裏付ける補完的な指標となる。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "都道府県の歳出のうちどれだけが職員給与など人件費に充てられているか。",
        "targetReaderOrDecision": "性質別歳出の構成を職種・給与の観点から確認したい読者。"
      }
    },
    {
      "rankingKey": "assistance-expenditure-ratio-pref-finance",
      "shortLabel": "扶助費割合",
      "role": "context",
      "selection": {
        "proposedBy": "地方財政の状況（総務省、令和7年3月）第1部 4 地方経費の内容「性質別歳出」",
        "sourceUrl": "https://www.soumu.go.jp/main_content/000998475.pdf",
        "surveyedAt": "2026-09-16",
        "rationale": "総務省の地方財政白書は扶助費を義務的経費の一つとして位置付け、生活困窮者・児童・障害者等への援助に要する経費であり任意に削減することが困難な支出であると説明している。扶助費割合は歳出に占める義務的な社会保障関係経費の重さを示し、都道府県財政の弾力性を測る指標として「財政運営の余裕と負担」の章の問いに直結する。",
        "adoptionCriteria": ["representativeness", "comparability"],
        "readerQuestion": "自分の都道府県は歳出のうちどれくらいを社会保障関係の給付に振り向けているか。",
        "targetReaderOrDecision": "都道府県の財政の硬直度合いを他地域と比較したい読者。"
      }
    },
    {
      "rankingKey": "investment-expenditure-ratio-pref-finance",
      "shortLabel": "投資的経費割合",
      "role": "context",
      "selection": {
        "proposedBy": "令和5年版 地方財政白書ビジュアル版（令和3年度決算）「歳出 4.性質別歳出」（総務省）",
        "sourceUrl": "https://www.soumu.go.jp/iken/zaisei/r05data/2023data/r05020304.html",
        "surveyedAt": "2026-09-16",
        "rationale": "地方財政白書ビジュアル版は性質別歳出を義務的経費・投資的経費・その他の経費の3区分で説明しており、投資的経費は普通建設事業費など社会資本整備に充てられる裁量的支出として義務的経費と対比される。投資的経費割合は歳出構成の裁量性を示し、扶助費割合など義務的経費の比率と組み合わせることで財政運営の余裕を多面的に把握できる。",
        "adoptionCriteria": ["representativeness", "complementarity", "comparability"],
        "readerQuestion": "この都道府県は社会資本整備にどれだけ歳出を振り向けているか、それは年々どう変化しているか。",
        "targetReaderOrDecision": "公共投資の水準を地域間・時系列で比較したい読者。"
      }
    },
    {
      "rankingKey": "welfare-expenditure-ratio-pref-finance",
      "shortLabel": "民生費割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "民生費割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "education-expenditure-ratio-pref-finance",
      "shortLabel": "教育費割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "教育費割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "public-works-expenditure-ratio-pref-finance",
      "shortLabel": "土木費割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "土木費割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "per-capita-inhabitant-tax-pref-municipal",
      "shortLabel": "住民税（人口1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/D",
        "surveyedAt": "2026-09-08",
        "rationale": "人口1人を基準にした住民税として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税対象所得（納税義務者1人当たり）",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/D",
        "surveyedAt": "2026-09-08",
        "rationale": "納税義務者1人を基準にした課税対象所得として比較する。関連指標の索引で補足する。"
      }
    },
    {
      "rankingKey": "taxpayer-ratio-per-pref-resident",
      "shortLabel": "納税義務者割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "納税義務者割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "laspeyres-index-prefecture",
      "shortLabel": "ラスパイレス指数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.soumu.go.jp/iken/kyuyo.html",
        "surveyedAt": "2026-09-08",
        "rationale": "ラスパイレス指数は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "municipality-count",
      "shortLabel": "市町村数",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-14",
        "rationale": "自治体数を行政サービス・財政指標を読む基礎条件として詳細索引に保持する。"
      }
    },
    {
      "rankingKey": "households-on-public-assistance",
      "shortLabel": "生活保護被保護実世帯数",
      "role": "context",
      "selection": {
        "proposedBy": "参考文献由来テーマ企画 REFERENCE-CONTENT-DRAFTS-01",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-14",
        "rationale": "扶助費比率の実数根拠として、制度利用世帯数を財政の基礎条件に保持する。"
      }
    }
  ],
  "charts": [],
  "evidenceTopics": [
    {
      "key": "revenue-base-and-equalization",
      "lensKey": "composition",
      "title": "自主財源と財源調整の構成",
      "question": "地方税と地方交付税の構成は、地域の財源基盤の違いをどう補っているか。",
      "summary": "財政力指数と歳入構成を組み合わせて読みます。地方税割合と地方交付税割合は歳入総額を分母とする構成比であり、割合だけで財政余力や税負担の大きさは判断できません。",
      "sourceKeys": [
        "mic-local-finance-whitepaper-2025"
      ],
      "relatedRankingKeys": [
        "fiscal-strength-index-prefecture",
        "local-tax-ratio-pref-finance",
        "local-allocation-tax-ratio-pref-finance"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "debt-burden-and-soundness",
      "lensKey": "sustainability",
      "title": "公債費と将来負担の持続可能性",
      "question": "現在の公債費負担と将来負担は、地域の財政運営にどのような制約を与えるか。",
      "summary": "実質公債費比率と将来負担比率は、対象期間と算定対象が異なる健全化判断比率です。関連ランキングは2022年度、確報資料は2023年度決算のため、同一年の値として比較しません。",
      "sourceKeys": [
        "mic-fiscal-soundness-ratios-fy2023"
      ],
      "relatedRankingKeys": [
        "real-public-debt-service-ratio",
        "future-burden-ratio"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "local-economy"
      ]
    }
  ],
  "keywords": [
    "地方財政",
    "財政力指数",
    "経常収支比率",
    "実質公債費比率",
    "将来負担比率",
    "地方税",
    "地方交付税",
    "歳出構造",
    "都道府県",
    "ランキング"
  ],
  "sections": [
    {
      "key": "balance",
      "title": "財政の規模と収支",
      "description": "都道府県の会計を対象に、収支・積立金・地方債を決算年度付きで確認します。市町村会計の合計ではありません。",
      "metricGroupKeys": [],
      "embeddedSectionKeys": [
        "finance-overview"
      ]
    },
    {
      "key": "fiscal-capacity",
      "title": "財政運営の余裕と負担",
      "description": "財政力、経常経費、公債費、将来負担は別の側面です。指標を足して総合点にはしません。",
      "metricGroupKeys": [],
      "embeddedSectionKeys": [
        "finance-sustainability"
      ]
    },
    {
      "key": "finance-flow",
      "title": "どこから調達し何に使うか",
      "description": "財源と使い道を確認します。目的別歳出と性質別歳出は分類が違うため、一つの構成比に混ぜません。",
      "metricGroupKeys": [],
      "embeddedSectionKeys": [
        "finance-flow"
      ]
    }
  ]
};
