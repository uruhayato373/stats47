import type { MetricConfig } from '../types';

export const residentialOfficialLandPointCount: MetricConfig = {
  "key": "residential-official-land-point-count",
  "title": "住宅地の公示標準地数（100〜300㎡未満）",
  "unit": "地点",
  "category": "construction",
  "note": "公表面積100㎡以上300㎡未満。用途・面積帯以外の立地・接道・形状等は統制していない。2025年1月1日時点の住宅地標準地（用途000）。鑑定士別評価額ではなく公示価格の1標準地1行を用いる。2025年中の取引と1月1日の公示価格を時点調整していないため、価格差率や割安・割高の判定には使わない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "国土交通省 国土数値情報 地価公示",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2025.html",
        "license": "CC-BY-4.0"
      },
      "description": "公式KSJ L01-2025全国CSVをCP932で読込。番号用途区分=000、地積100以上300未満、価格R07の正の有限値を採用。行政区域コード・番号用途区分・番号連番の複合キーを一意に保持。GeoJSONのL01_008/027/007と全25,563行を照合。対象行の件数を集計。",
      "provenance": {
        "publicationIndexUrl": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2025.html",
        "url": "https://nlftp.mlit.go.jp/ksj/old/data/L01/L01-2025P/L01-2025P-48-01.0a.zip",
        "table": "L01-2025P全国CSV 住宅地標準地",
        "valueColumn": "価格R07",
        "dataYear": "2025年1月1日",
        "accessedAt": "2026-09-10",
        "extraction": "公式KSJ L01-2025全国CSVをCP932で読込。番号用途区分=000、地積100以上300未満、価格R07の正の有限値を採用。行政区域コード・番号用途区分・番号連番の複合キーを一意に保持。GeoJSONのL01_008/027/007と全25,563行を照合。対象行の件数を集計。",
        "verification": "CSVとGeoJSONの25,563標準地・76,689数値が完全一致。公式公表調査地点25,563と一致。条件内14,099地点。",
        "restore": "provenance.url のZIPと L01-25_GML.zip を取得し source-manifest.json のSHAを検証。aggregate.py → prepare-proposal.py → build-config-proposals.py。"
      },
      "profileKey": "property-price-distribution",
      "sourceManifestSha256": "172eeb706c9bd080567ca828a38b6dbf05b50444da69fe5e6e5bb61cc3bdf639",
      "dataset": "officialLandPrice",
      "statistic": "count"
    },
    "displayName": "国土交通省 国土数値情報 地価公示",
    "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2025.html"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2025,
    "to": 2025
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "不動産取引価格の公開回答資料または地価公示標準地の記録を条件固定で再集計した値。一般の統計調査の県平均と区別する。",
  "isActive": true
};
