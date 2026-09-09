import type { ThemeCatalog } from "./types";

export const ROADS_CATALOG: ThemeCatalog = {
  overview: {
    "introduction": "道路法に基づく道路の供用延長・舗装率と、昼間12時間の交通量。",
    "headlineRankingKeys": [
      "road-length-per-km2",
      "road-total-length-with-expressway",
      "road-expressway-length",
      "average-road-traffic-volume"
    ],
    "comparisonRankingKeys": [
      "road-length-per-km2",
      "road-total-length-with-expressway",
      "road-expressway-length",
      "average-road-traffic-volume",
      "main-road-paving-rate",
      "road-national-route-length",
      "road-municipal-length"
    ],
    "mapNotes": {
      "road-length-per-km2": "総面積1km²当たりの道路延長。高速道路を含む実延長とは対象が異なります。",
      "road-total-length-with-expressway": "高速道路を含む道路網の総量。人口当たりの値ではありません。",
      "road-expressway-length": "高速道路の延長。長さだけで目的地への行きやすさは判断できません。",
      "average-road-traffic-volume": "昼間12時間の平均交通量。年間の総交通量ではありません。",
      "main-road-paving-rate": "一般国道・都道府県道の舗装割合。市町村道を含みません。",
      "road-national-route-length": "一般国道の供用実延長。高速自動車国道を含みません。",
      "road-municipal-length": "市町村道の供用実延長。高速道路・一般国道を含みません。"
    }
  },
  "key": "roads",
  "title": "道路",
  "description": "都道府県別の道路実延長（高速道路・国道・地方道・市町村道）・道路密度・舗装率・交通量をランキングとチャートで比較。高速道路網の地域差や面積あたり道路密度の都市部集中、道の駅の整備状況を47都道府県のデータで読み解きます。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "road-total-length-with-expressway",
      "shortLabel": "道路実延長（高速含む）",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2025・道路施設現況調査",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/H",
        "surveyedAt": "2026-09-09",
        "rationale": "維持管理する道路ストックの規模を示す。高速道路を含む総量を概況カードと比較表に採用。"
      }
    },
    {
      "rankingKey": "road-expressway-length",
      "shortLabel": "高速道路延長",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2025 幹線道路ネットワーク",
        "sourceUrl": "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n2511000.html",
        "surveyedAt": "2026-09-09",
        "rationale": "幹線道路の供給規模を示し、生活道路中心の総延長と区別する。"
      }
    },
    {
      "rankingKey": "road-total-length",
      "shortLabel": "道路実延長",
      "role": "context"
    },
    {
      "rankingKey": "road-national-route-length",
      "shortLabel": "一般国道延長",
      "role": "secondary",
      "selection": {
        "proposedBy": "道路施設現況調査",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/H",
        "surveyedAt": "2026-09-09",
        "rationale": "一般国道と市町村道の構成差を比較表で読む。総延長カードの重複を避け初期KPIにしない。"
      }
    },
    {
      "rankingKey": "road-prefectural-route-length",
      "shortLabel": "主要地方道延長",
      "role": "context"
    },
    {
      "rankingKey": "road-municipal-length",
      "shortLabel": "市町村道延長",
      "role": "secondary",
      "selection": {
        "proposedBy": "道路施設現況調査",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/H",
        "surveyedAt": "2026-09-09",
        "rationale": "生活道路の供給規模を比較表で補い、広域交通の高速道路延長と区別する。"
      }
    },
    {
      "rankingKey": "road-length-per-km2",
      "shortLabel": "道路密度",
      "role": "primary",
      "selection": {
        "proposedBy": "国土交通白書2025・社会人口統計体系の指標計算式",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-09",
        "rationale": "面積規模に左右される延長の総量を補い、県内道路網の密度を地図で比較する。分母は総面積。"
      }
    },
    {
      "rankingKey": "main-road-paving-rate",
      "shortLabel": "主要道路舗装率",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系の指標計算式",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-09",
        "rationale": "主要道路の整備水準を比較表で補う。維持管理状態や老朽度の代用にしない。"
      }
    },
    {
      "rankingKey": "average-road-traffic-volume",
      "shortLabel": "昼間12時間の交通量",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系の指標計算式",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/H",
        "surveyedAt": "2026-09-09",
        "rationale": "道路供給の延長に対し利用密度を補う。昼間12時間の値であり年間総量として扱わない。"
      }
    },
    {
      "rankingKey": "roadside-station-count",
      "shortLabel": "道の駅数",
      "role": "context"
    }
  ],
  "charts": [],
  evidenceTopics: [
    {
      "key": "trunk-road-network-access",
      "lensKey": "regional-access",
      "title": "幹線道路ネットワークと地域アクセス",
      "question": "高速道路の延長と道路密度には、広域移動を支えるネットワークの地域差がどう表れるか",
      "summary": "高速道路延長と面積当たり道路延長を分け、道路網の総量と地域内の密度を読み比べます。",
      "sourceKeys": [
        "mlit-whitepaper-2025-road-network"
      ],
      "relatedRankingKeys": [
        "road-expressway-length",
        "road-length-per-km2",
        "average-road-traffic-volume"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "local-economy"
      ]
    },
    {
      "key": "road-stock-maintenance",
      "lensKey": "sustainability",
      "title": "道路ストックの規模と維持管理",
      "question": "道路実延長と舗装率を合わせると、維持対象の規模と整備水準をどう読み分けられるか",
      "summary": "延長は維持対象の規模、舗装率は整備水準を示します。延長だけで老朽化の程度は判断しません。",
      "sourceKeys": [
        "mlit-whitepaper-2025-infrastructure-maintenance"
      ],
      "relatedRankingKeys": [
        "road-total-length-with-expressway",
        "main-road-paving-rate"
      ],
      "relatedChartKeys": [],
      "relatedThemeKeys": [
        "local-finance"
      ]
    }
  ],
  "keywords": [
    "道路",
    "高速道路",
    "国道",
    "県道",
    "舗装率",
    "交通量",
    "道の駅",
    "インフラ"
  ],
  "relatedArticleTagKeys": [
    "道路",
    "高速道路",
    "交通",
    "インフラ"
  ]
};
