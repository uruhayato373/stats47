import type { MetricConfig } from "../types";

export const ambulanceHospitalArrivalTime: MetricConfig = {
  "key": "ambulance-hospital-arrival-time",
  "title": "救急搬送 病院収容所要時間",
  "unit": "分",
  "category": "safetyenvironment",
  "note": "入電から医師引継ぎ(病院収容)までの平均所要時間。令和6年(2024)中",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "消防庁「救急・救助の現況」令和7年版 別表8の1",
        "url": "https://www.fdma.go.jp/publication/rescue/post-7.html",
        "license": "PDL1.0(政府標準利用規約・商用可・出典表示必須)",
      },
      "description": "入電から医師引継ぎ(病院収容)までの平均所要時間(分)。別表8の1「病院収容所要時間別搬送人員の状況」の各都道府県行の令和6年中平均(分)列",
      "provenance": {
        "publicationIndexUrl": "https://www.fdma.go.jp/publication/rescue/post-7.html",
        "pdfUrl": "https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf",
        "table": "別表8の1 病院収容所要時間別搬送人員の状況",
        "pdfPage": 60,
        "valueColumn": "令和6年中 平均(分)",
        "dataYear": "令和6年(2024)中",
        "accessedAt": "2026-07-19",
        "extraction": "pdftotext -layout で救急編PDFをテキスト化→別表8の1(p60)の各県行末尾の令和6年平均(分)を抽出",
        "verification": "全国合計行の平均44.6分が消防庁公表値と一致(検算パス)。最短=富山33.1/最長=東京60.5",
        "restore": "curl -sL <pdfUrl> -o k.pdf && pdftotext -layout k.pdf k.txt で別表8の1を再取得し47県の令和6平均列を突合",
      },
    },
    "displayName": "消防庁「救急・救助の現況」",
    "url": "https://www.fdma.go.jp/publication/rescue/post-7.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "救急搬送、病院到着までなぜこんなに違う?｜東京60.5分 vs 富山33.1分【2024年】",
  "seoDescription": "救急車を呼んでから病院に収容されるまでの平均所要時間は、都道府県で最大1.8倍の差があります。1位東京都(60.5分)、最短は富山県(33.1分)。地図とグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
