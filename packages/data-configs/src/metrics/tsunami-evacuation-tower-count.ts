import type { MetricConfig } from '../types';

export const tsunamiEvacuationTowerCount: MetricConfig = {
  "key": "tsunami-evacuation-tower-count",
  "title": "津波避難タワー等数",
  "subtitle": "内閣府調査・4月1日現在",
  "description": "津波から避難するために整備された津波避難タワー等の棟数。やぐら型のほか建物型、マウンド型、人工地盤、避難シェルターを含む。調査対象の市区町村の報告を都道府県別に集計したもの。",
  "note": "海岸線を有する、または津波の遡上等による被害が想定される40都道府県が対象です。対象外の栃木・群馬・埼玉・山梨・長野・滋賀・奈良は数値なしとし、岐阜の公表0は保持します。2023年調査は海岸線地域の避難指示が継続していた福島県大熊町を除きます。施設整備数であり、浸水人口・浸水面積・危険度の指標ではありません。施設数は収容可能人数や津波への安全性を示しません。",
  "unit": "棟",
  "category": "safetyenvironment",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "内閣府「津波避難ビル及び津波避難タワー等の整備数」",
    "url": "https://www.bousai.go.jp/jishin/tsunami/hinan/tsunami_top.html",
    "config": {
      "nonApplicablePrefectures": {
        "codes": [
          "09000",
          "10000",
          "11000",
          "19000",
          "20000",
          "25000",
          "29000"
        ],
        "reason": "内閣府調査の対象外（原表明記）"
      },
      "source": {
        "name": "内閣府「津波避難ビル及び津波避難タワー等の整備数」",
        "url": "https://www.bousai.go.jp/jishin/tsunami/hinan/tsunami_top.html"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/tsunami_top.html",
        "pdfUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/02_r504.pdf",
        "table": "都道府県別（令和5年4月時点）及び参考資料3の都道府県別（令和3年4月時点）",
        "pdfPage": 1,
        "valueColumn": "津波避難タワー等（棟）",
        "dataYear": "2021年・2023年4月1日現在",
        "accessedAt": "2026-09-10",
        "extraction": "専用ingesterの原典URL・SHA256一覧からPDFを取得し、pdftotext -layoutで県別表を抽出。県番号・県名・数値40県と対象外7県を照合し、対象外はnullを維持。",
        "verification": "両年とも47行、40県の数値と7県の対象外集合が一致。市区町村表の675/678団体の合算が全40県と全国計に一致。2021年15,304/502棟、2023年14,726/550棟。2023年は2024-08-05訂正版。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-tsunami-evacuation.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      2021,
      2023
    ]
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "自治体による津波避難施設の指定・整備状況の行政報告",
  "isActive": true
};
