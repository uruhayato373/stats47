import type { MetricConfig } from '../types';

export const debrisFlowSpecialWarningZoneCount: MetricConfig = {
  "key": "debris-flow-special-warning-zone-count",
  "title": "土石流の特別警戒区域数",
  "subtitle": "2026年6月30日時点の指定区域数",
  "description": "土砂災害防止法に基づく指定区域数を比較します。特別警戒区域は警戒区域の内数で、両者は足し合わせません。",
  "note": "区域数は危険の総量だけでなく指定・調査進捗にも左右されます。面積、区域内人口や施設数を表す指標ではありません。国交省の集計時点と自治体の公表時点の違いにより値が異なる場合があります。原表右側の基礎調査公表済区域（2026年3月末）とは区別します。",
  "unit": "区域",
  "category": "safetyenvironment",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "国土交通省「土砂災害警戒区域等の指定状況」",
    "url": "https://www.mlit.go.jp/mizukokudo/sabo/content/001982570.pdf",
    "config": {
      "source": {
        "name": "国土交通省「土砂災害警戒区域等の指定状況」",
        "url": "https://www.mlit.go.jp/mizukokudo/sabo/content/001982570.pdf"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mlit.go.jp/mizukokudo/sabo/linksinpou.html",
        "url": "https://www.mlit.go.jp/mizukokudo/sabo/content/001982570.pdf",
        "table": "全国における土砂災害警戒区域等の指定状況・1ページ",
        "valueColumn": "都道府県名右側の数値第2列（土石流の特別警戒区域数）",
        "dataYear": "2026年6月30日時点",
        "accessedAt": "2026-09-10",
        "extraction": "SHA固定の原表PDFをpdftotext -layoutで読み、県名で47県を識別。右側参考欄を除いた指定区域の8列を抽出。",
        "verification": "47県の欠測・重複なし、各県の3現象合計と総計が一致。全47県の各列合計が原表全国合計と一致。特別警戒は警戒の内数。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-landslide-designations.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2026,
    "to": 2026
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "法に基づく行政の区域指定状況",
  "isActive": true
};
