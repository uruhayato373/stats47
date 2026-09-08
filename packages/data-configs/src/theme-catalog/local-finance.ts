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
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "財政力指数は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "current-balance-ratio",
      "shortLabel": "経常収支比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "経常収支比率は「財政運営の余裕と負担」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "real-public-debt-service-ratio",
      "shortLabel": "実質公債費比率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "実質公債費比率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "future-burden-ratio",
      "shortLabel": "将来負担比率",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "将来負担比率は「財政運営の余裕と負担」を読むため主要画面へ配置する。"
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
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "人件費割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "assistance-expenditure-ratio-pref-finance",
      "shortLabel": "扶助費割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "扶助費割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
      }
    },
    {
      "rankingKey": "investment-expenditure-ratio-pref-finance",
      "shortLabel": "投資的経費割合",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "投資的経費割合は専用の決算カード・財政フローを読むための補足指標として全指標索引から参照する。表示する金額と比率、都道府県会計と市町村を含む集計の範囲を区別する。"
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
