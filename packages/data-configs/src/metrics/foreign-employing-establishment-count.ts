import type { MetricConfig } from '../types';

export const foreignEmployingEstablishmentCount: MetricConfig = {
  "key": "foreign-employing-establishment-count",
  "title": "外国人雇用事業所数",
  "subtitle": "雇用届出・10月末時点",
  "description": "届出対象の外国人を雇用する事業所数を、10月末時点で都道府県別に比較します。",
  "note": "特別永住者、在留資格「外交」「公用」は届出対象外です。公表値は事業主からの届出件数に基づくため、外国人住民人口や年間の新規採用人数とは異なります。事業所数は企業数ではありません。2025年10月末の値は2026年1月30日に公表されています。",
  "unit": "所",
  "category": "laborwage",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「外国人雇用状況」の届出状況まとめ",
    "url": "https://www.mhlw.go.jp/content/11655000/001646132.xlsx",
    "config": {
      "source": {
        "name": "厚生労働省「外国人雇用状況」の届出状況まとめ",
        "url": "https://www.mhlw.go.jp/content/11655000/001646132.xlsx"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.mhlw.go.jp/stf/newpage_68794.html",
        "url": "https://www.mhlw.go.jp/content/11655000/001646132.xlsx",
        "pdfUrl": "https://www.mhlw.go.jp/content/11655000/001646131.pdf",
        "table": "別表２「都道府県別外国人雇用事業所数及び外国人労働者数」",
        "pdfPage": 3,
        "valueColumn": "別表２!C7:C53（全国計 C6）",
        "dataYear": "2025年10月末時点（2026年1月30日公表）",
        "accessedAt": "2026-09-10",
        "extraction": "SHA固定の公式XLSXの県番号・県名を47県と照合し、C列の事業所数とG列の外国人労働者数を抽出。参考-7の令和7年K/M列は同年照合に限り、前年比・前年値を混ぜない。本文PDFから除外対象と観測時点を検査。",
        "verification": "47県94値は公式PDF別表2の全値と一致。参考-7の令和7年94値、別表3の在留資格総計47値にも一致。47県合計は労働者2,571,037人、事業所371,215所で原表全国計と一致。欠測・重複・負値なし。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-foreign-employment.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2025,
    "to": 2025
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "外国人雇用状況届出に基づく行政集計（外国人雇用実態調査とは別）",
  "isActive": true
};
