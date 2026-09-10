import type { ThemeCatalog } from "./types";

export const CLIMATE_CATALOG: ThemeCatalog = {
  "key": "climate",
  "title": "気候",
  "description": "日照、気温、降水・降雪の違いを、観測地点と期間を明示して比較する。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "annual-sunshine-duration",
      "shortLabel": "年間日照時間",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "年間日照時間は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "annual-clear-days",
      "shortLabel": "年間快晴日数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "日照時間の補足であり主問の最上部を重複させないためcontextへ格下げ。"
      }
    },
    {
      "rankingKey": "average-temperature",
      "shortLabel": "年平均気温",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "年平均気温は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "maximum-temperature",
      "shortLabel": "最高気温",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "最高気温は「気温」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "lowest-temperature",
      "shortLabel": "最低気温",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "最低気温は「気温」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "annual-precipitation",
      "shortLabel": "年間降水量",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "年間降水量は「降水と雪」を読むため主要画面へ配置する。"
      }
    },
    {
      "rankingKey": "annual-precipitation-days",
      "shortLabel": "年間降水日数",
      "role": "context",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "降水日数は「降水と雪」の補足として詳細索引に保持し、冒頭の要約へ重ねない。"
      }
    },
    {
      "rankingKey": "annual-snow-days",
      "shortLabel": "年間雪日数",
      "role": "secondary",
      "selection": {
        "proposedBy": "全テーマ構成監査（既存統計・公開データの照合）",
        "sourceUrl": "https://www.stat.go.jp/data/ssds/index.htm",
        "surveyedAt": "2026-09-08",
        "rationale": "雪日数は「降水と雪」を読むため主要画面へ配置する。"
      }
    }
  ],
  "charts": [
    {
      "componentKey": "theme-climate-temperature-extremes",
      "componentType": "line-chart",
      "title": "最高・最低気温の推移",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "maximum-temperature",
            "label": "最高気温",
            "colorRole": "series-1"
          },
          {
            "metricKey": "lowest-temperature",
            "label": "最低気温",
            "colorRole": "series-2"
          }
        ]
      },
      "relatedRankingKeys": [
        "maximum-temperature",
        "lowest-temperature"
      ],
      "sourceName": "社会・人口統計体系",
      "sourceLink": "https://www.stat.go.jp/data/ssds/index.htm",
      "gridColumnSpan": 12,
      "dataSource": "ranking",
      "sortOrder": 10,
      "annotation": "代表観測地点の値です。年平均気温とは統計の意味が異なります。",
      "section": "temperature"
    }
  ],
  "keywords": [
    "気候",
    "日照時間",
    "気温",
    "降水量",
    "降雪",
    "天候",
    "都道府県"
  ],
  "sections": [
    {
      "key": "sunshine",
      "title": "日照",
      "description": "代表観測地点の日照時間と快晴日数です。県内全域の平均ではありません。",
      "metricGroupKeys": [
        "sunshine"
      ],
      "chartKeys": []
    },
    {
      "key": "temperature",
      "title": "気温",
      "description": "年平均気温と最高・最低気温は別の尺度です。年平均の単年値と、最高・最低の収録期間を確認します。",
      "metricGroupKeys": [
        "temperature"
      ],
      "chartKeys": [
        "theme-climate-temperature-extremes"
      ]
    },
    {
      "key": "rain-snow",
      "title": "降水と雪",
      "description": "降水量、降水日数、雪日数を別々に確認します。観測地点や収録年の違いに注意してください。",
      "metricGroupKeys": [
        "rain-snow-1",
        "rain-snow-2"
      ],
      "chartKeys": []
    },
    {
      "key": "snow-designation-population",
      "title": "豪雪指定区域と人口",
      "description": "2016年度の指定区域と2020年基準人口の250mメッシュを重ね、区域内人口・面積と境界格子の感度を確認します。",
      "metricGroupKeys": [],
      "chartKeys": [],
      "embeddedSectionKeys": ["snow-designation-population"]
    },
    {
      "key": "sunshine-map",
      "title": "県内の日照分布",
      "description": "地図は県内の日照分布を示します。代表観測地点の統計とは解像度・対象期間が異なります。",
      "metricGroupKeys": [],
      "chartKeys": [],
      "embeddedSectionKeys": [
        "sunshine-map"
      ]
    }
  ],
  "metricGroups": [
    {
      "key": "sunshine",
      "title": "日照",
      "rankingKeys": [
        "annual-sunshine-duration"
      ],
      "defaultCheckedKeys": [
        "annual-sunshine-duration"
      ]
    },
    {
      "key": "temperature",
      "title": "気温",
      "rankingKeys": [
        "average-temperature"
      ],
      "defaultCheckedKeys": [
        "average-temperature"
      ]
    },
    {
      "key": "rain-snow-1",
      "title": "年間降水量",
      "rankingKeys": [
        "annual-precipitation"
      ],
      "defaultCheckedKeys": [
        "annual-precipitation"
      ]
    },
    {
      "key": "rain-snow-2",
      "title": "年間雪日数",
      "rankingKeys": [
        "annual-snow-days"
      ],
      "defaultCheckedKeys": [
        "annual-snow-days"
      ]
    }
  ]
};
