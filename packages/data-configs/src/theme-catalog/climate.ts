import type { ThemeCatalog } from "./types";

export const CLIMATE_CATALOG: ThemeCatalog = {
  "key": "climate",
  "title": "気候",
  "description": "都道府県別の年間日照時間・年平均気温・年間降水量・降雪をランキングとチャートで比較。太平洋側と日本海側、南北の気候差や、晴れの多い地域・豪雪地帯を 47 都道府県のデータで読み解きます。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "annual-sunshine-duration",
      "shortLabel": "年間日照時間",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系・気象庁 過去の気象データ",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
        "surveyedAt": "2026-09-09",
        "rationale": "日照という暮らしの条件を温度・降水とは別のKPIとして示す。"
      }
    },
    {
      "rankingKey": "annual-clear-days",
      "shortLabel": "快晴日数",
      "role": "context"
    },
    {
      "rankingKey": "average-temperature",
      "shortLabel": "年平均気温",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系・気象庁 過去の気象データ",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
        "surveyedAt": "2026-09-09",
        "rationale": "地域の温熱条件を地図で比較する。観測地点と年平均を県全域平均や平年値へ読み替えない。"
      }
    },
    {
      "rankingKey": "maximum-temperature",
      "shortLabel": "最暖月の日最高平均",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・気象庁 過去の気象データ",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
        "surveyedAt": "2026-09-09",
        "rationale": "最暖月の昼間の暑さを比較表で補う。日最高気温の月平均の年最大で、絶対最高気温ではない。"
      }
    },
    {
      "rankingKey": "lowest-temperature",
      "shortLabel": "最寒月の日最低平均",
      "role": "secondary",
      "selection": {
        "proposedBy": "社会人口統計体系・気象庁 過去の気象データ",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
        "surveyedAt": "2026-09-09",
        "rationale": "最寒月の夜間の寒さを比較表で補う。日最低気温の月平均の年最小で、絶対最低気温ではない。"
      }
    },
    {
      "rankingKey": "annual-precipitation",
      "shortLabel": "年間降水量",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系・気象庁 過去の気象データ",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
        "surveyedAt": "2026-09-09",
        "rationale": "降水の量を示し、降水日数という頻度と並べて地域差を読む。"
      }
    },
    {
      "rankingKey": "annual-precipitation-days",
      "shortLabel": "降水日数",
      "role": "primary",
      "selection": {
        "proposedBy": "社会人口統計体系・気象庁 過去の気象データ",
        "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
        "surveyedAt": "2026-09-09",
        "rationale": "量だけでは分からない降水頻度を補う。終了済みの雪日数・快晴日数より現行項目を優先する。"
      }
    },
    {
      "rankingKey": "annual-snow-days",
      "shortLabel": "雪日数",
      "role": "context"
    }
  ],
  "keywords": [
    "気候",
    "日照時間",
    "気温",
    "降水量",
    "降雪",
    "快晴日数",
    "天候",
    "都道府県"
  ],
  "charts": [
    {
      "componentKey": "climate-temperature-seasonal-extremes",
      "componentType": "line-chart",
      "title": "最暖月・最寒月の気温の推移",
      "annotation": "各年の日最高気温の月平均の最高値と、日最低気温の月平均の最低値。年間の最高・最低記録ではありません。",
      "componentProps": {
        "seriesRefs": [
          {
            "metricKey": "maximum-temperature",
            "label": "最暖月の日最高平均",
            "colorRole": "danger"
          },
          {
            "metricKey": "lowest-temperature",
            "label": "最寒月の日最低平均",
            "colorRole": "population"
          }
        ]
      },
      "relatedRankingKeys": [
        "maximum-temperature",
        "lowest-temperature"
      ],
      "sourceName": "気象庁 過去の気象データ（社会・人口統計体系収録）",
      "sourceLink": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/B",
      "gridColumnSpan": 12,
      "gridColumnSpanTablet": null,
      "gridColumnSpanSm": null,
      "dataSource": "ranking",
      "section": "気温",
      "sortOrder": 10
    }
  ],
  "overview": {
    "introduction": "主に県庁所在地の観測値（埼玉：熊谷、滋賀：彦根）。県全域の平均ではありません。",
    "headlineRankingKeys": [
      "average-temperature",
      "annual-sunshine-duration",
      "annual-precipitation",
      "annual-precipitation-days"
    ],
    "comparisonRankingKeys": [
      "average-temperature",
      "annual-sunshine-duration",
      "annual-precipitation",
      "annual-precipitation-days",
      "maximum-temperature",
      "lowest-temperature"
    ],
    "mapNotes": {
      "average-temperature": "主に県庁所在地の観測値。県全体の平均ではなく、埼玉は熊谷・滋賀は彦根です。",
      "annual-sunshine-duration": "観測地点の年間値。県全域の日照や30年間の平年値ではありません。",
      "annual-precipitation": "観測地点の年間降水量。県全域の平均ではなく、雪を水に換えた量も含みます。",
      "annual-precipitation-days": "1日1mm以上の降水を観測した日数。雪による降水も含みます。",
      "maximum-temperature": "日最高気温の月平均が最も高い月の値。年間の最高記録ではありません。",
      "lowest-temperature": "日最低気温の月平均が最も低い月の値。年間の最低記録ではありません。"
    }
  }
};
