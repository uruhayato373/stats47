import type { ThemeCatalog } from "./types";

export const ROADS_CATALOG: ThemeCatalog = {
  "key": "roads",
  "title": "道路",
  "description": "道路ストックの延長と密度、利用交通量、整備状況を分けて比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "road-total-length-with-expressway",
      "shortLabel": "道路実延長(高速含む)",
      "role": "primary",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ 基礎データ「H711001_道路実延長（高速道路を含む）」（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010108",
        "surveyedAt": "2026-09-16",
        "rationale": "総務省統計局の社会・人口統計体系は、高速自動車国道・一般国道・都道府県道・市町村道を合算した実延長を都道府県別・単一の項目として定義しており、道路ストックの総量を都道府県間で同一基準で比較する際の基礎となる。「道路ストックの規模と密度」章の出発点として、まず総延長の絶対差を示す指標として位置付けられる。",
        "adoptionCriteria": ["representativeness", "comparability", "dataQuality"],
        "readerQuestion": "自分の都道府県の道路網は全国的に見てどれくらいの規模か。",
        "targetReaderOrDecision": "都道府県別の道路インフラ規模を比較したい一般読者・地方自治体関係者。"
      }
    },
    {
      "rankingKey": "road-expressway-length",
      "shortLabel": "高速道路延長",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ 基礎データ「H7113_道路実延長（高速道路）」（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010108",
        "surveyedAt": "2026-09-16",
        "rationale": "同じ統計体系のなかで高速道路のみの実延長が独立項目として区分されており、道路実延長（高速道路を含む）とは別に都道府県別の広域幹線網の整備量を取り出して比較できる。これにより「高速道路ネットワーク」章で、総延長のうちどれだけが高速自動車国道で構成されているかという角度からの補完的な読み解きが可能になる。",
        "adoptionCriteria": ["complementarity", "comparability"],
        "readerQuestion": "自分の都道府県には高速道路がどれくらい整備されているか。",
        "targetReaderOrDecision": "広域移動インフラの整備水準を確認したい読者。"
      }
    },
    {
      "rankingKey": "road-total-length",
      "shortLabel": "道路実延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "道路実延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-national-route-length",
      "shortLabel": "一般国道延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "一般国道延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-prefectural-route-length",
      "shortLabel": "主要地方道延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "主要地方道延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-municipal-length",
      "shortLabel": "市町村道延長",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "市町村道延長は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "road-length-per-km2",
      "shortLabel": "道路実延長（総面積1km²当たり）",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標「#H06401_道路実延長（総面積1km2当たり）」（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010208",
        "surveyedAt": "2026-09-16",
        "rationale": "社会生活統計指標では道路実延長を総面積1km2当たりに換算した密度指標として1975年度以降長期に整備しており、面積の大きい北海道のような県と面積の小さい大都市圏の県を同一基準で比較できる。実延長の絶対値だけでは読み取れない「道路網の密度」という角度を提供するため、「道路ストックの規模と密度」章で実延長と対にして用いる意義がある。",
        "adoptionCriteria": ["comparability", "readerValue", "complementarity"],
        "readerQuestion": "面積が違う都道府県同士で道路の混み具合・密度はどう違うか。",
        "targetReaderOrDecision": "道路密度に基づく地域比較をしたい読者。"
      }
    },
    {
      "rankingKey": "main-road-paving-rate",
      "shortLabel": "主要道路舗装率",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標「#H06406_主要道路舗装率」（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010208",
        "surveyedAt": "2026-09-16",
        "rationale": "主要道路舗装率は1984年度から2023年度までの長期時系列で都道府県別に整備されている割合指標であり、道路実延長という量的指標とは別に整備の質を示す。延長や密度が大きくても未舗装が多ければ利用水準は低いため、「整備水準と利用状況」章において実延長・密度の量的指標を補完する形で採用する根拠がある。",
        "adoptionCriteria": ["dataQuality", "readerValue", "complementarity"],
        "readerQuestion": "自分の都道府県の主要道路はどれくらい舗装が進んでいるか。",
        "targetReaderOrDecision": "道路の整備の質（未舗装区間の有無）を確認したい読者。"
      }
    },
    {
      "rankingKey": "average-road-traffic-volume",
      "shortLabel": "道路平均交通量（昼間12時間）",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標「#H06413_道路平均交通量」（総務省統計局）",
        "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010208",
        "surveyedAt": "2026-09-16",
        "rationale": "道路平均交通量は昼間12時間の平均交通量という単位で都道府県別に整備された指標であり、道路ストックの延長・密度・舗装率という整備側の指標に対して、実際にどれだけ利用されているかという利用側の角度を補う。「整備水準と利用状況」章で整備量と利用量を対比させるために必要な指標である。",
        "adoptionCriteria": ["complementarity", "readerValue"],
        "readerQuestion": "整備された道路は実際にどれくらい交通量があるのか。",
        "targetReaderOrDecision": "道路の整備量と利用実態のギャップを確認したい読者。"
      }
    },
    {
      "rankingKey": "roadside-station-count",
      "shortLabel": "道の駅数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.mlit.go.jp/road/Michi-no-Eki/list.html",
        "surveyedAt": "2026-09-08",
        "rationale": "道の駅数は「道路種別の詳細」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "roads-length-trend",
      "componentType": "line-chart",
      "title": "道路実延長・高速道路延長の比較",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "road-total-length-with-expressway",
            "label": "道路実延長(高速含む)",
            "colorRole": "population"
          },
          {
            "metricKey": "road-expressway-length",
            "label": "高速道路延長",
            "colorRole": "danger"
          }
        ]
      },
      "relatedRankingKeys": [
        "road-total-length-with-expressway",
        "road-expressway-length"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "road-stock",
      "sortOrder": 10
    }
  ],
  "evidenceTopics": [
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
      "relatedChartKeys": [
        "roads-length-trend"
      ],
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
      "relatedChartKeys": [
        "roads-length-trend"
      ],
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
  ],
  "sections": [
    {
      "key": "road-stock",
      "title": "道路ストックの規模と密度",
      "description": "道路総延長と総面積1km²当たり道路実延長を分けて比較します。総延長は高速道路を含み、密度の分母は可住地面積ではなく総面積です。",
      "metricGroupKeys": [
        "road-stock",
        "road-density"
      ],
      "chartKeys": [
        "roads-length-trend"
      ]
    },
    {
      "key": "expressways",
      "title": "高速道路ネットワーク",
      "description": "高速道路は道路総延長の一部です。両者を足して道路全体の長さにはできません。",
      "metricGroupKeys": [
        "expressways"
      ],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "highway"
      ]
    },
    {
      "key": "condition-use",
      "title": "整備水準と利用状況",
      "description": "舗装率と交通量は整備状態と利用状況の別の側面です。",
      "metricGroupKeys": [
        "condition-use-1",
        "condition-use-2"
      ],
      "chartKeys": []
    }
  ],
  "metricGroups": [
    {
      "key": "road-stock",
      "title": "道路総延長",
      "rankingKeys": [
        "road-total-length-with-expressway"
      ],
      "defaultCheckedKeys": [
        "road-total-length-with-expressway"
      ]
    },
    {
      "key": "road-density",
      "title": "道路実延長（総面積1km²当たり）",
      "rankingKeys": [
        "road-length-per-km2"
      ],
      "defaultCheckedKeys": [
        "road-length-per-km2"
      ]
    },
    {
      "key": "expressways",
      "title": "高速道路ネットワーク",
      "rankingKeys": [
        "road-expressway-length"
      ],
      "defaultCheckedKeys": [
        "road-expressway-length"
      ]
    },
    {
      "key": "condition-use-1",
      "title": "主要道路舗装率",
      "rankingKeys": [
        "main-road-paving-rate"
      ],
      "defaultCheckedKeys": [
        "main-road-paving-rate"
      ]
    },
    {
      "key": "condition-use-2",
      "title": "道路平均交通量（昼間12時間）",
      "rankingKeys": [
        "average-road-traffic-volume"
      ],
      "defaultCheckedKeys": [
        "average-road-traffic-volume"
      ]
    }
  ]
};
