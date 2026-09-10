import type { MetricConfig } from '../types';

export const fitTransitionInstalledCapacity: MetricConfig = {
  "key": "fit-transition-installed-capacity",
  "title": "再エネ導入設備容量（旧制度移行認定分）",
  "subtitle": "制度開始前からの設備がFITへ移行した累積容量",
  "description": "再エネ導入設備容量（旧制度移行認定分）を47都道府県で比較します。",
  "note": "2026年3月31日時点の累積導入設備容量（2026年8月18日公表）。原表の導入は再エネ特措法の下で買取が開始された状態。新規認定分は制度開始後に新たに認定された設備で、当年の増設分ではありません。移行認定分は制度開始前に発電していた設備等が制度へ移行したもので、FITからFIPへの移行を表すものではありません。FIT・FIP別の内訳はこのA表では分かりません。自家消費のみの設備や制度認定を受けていない設備を含む全再エネ容量ではなく、発電量（kWh）とも異なります。バイオマスはバイオマス比率を考慮した容量。",
  "unit": "kW",
  "category": "energy",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "資源エネルギー庁 再エネ特措法情報公表（A表）",
    "url": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH",
    "config": {
      "source": {
        "name": "資源エネルギー庁 再エネ特措法情報公表（A表）",
        "url": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.fit-portal.go.jp/publicinfosummary",
        "url": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH",
        "pdfUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/karte/pdf/00.pdf",
        "table": "表A②－２!AH6:AH52",
        "valueColumn": "表A②－２!AH6:AH52",
        "dataYear": "2026年3月31日時点（累積）",
        "accessedAt": "2026-09-10",
        "extraction": "公式SHA固定Excelの47県を県名順で照合。合計は新規認定分導入容量と旧制度移行認定分導入容量を合算。比率考慮済みバイオマスを使用。",
        "verification": "{\"prefectures\":47,\"missing\":0,\"duplicates\":0,\"sourceComponentIdentities\":96,\"prefectureNationalSumMatches\":14,\"websiteRoundedMatches\":14,\"fitFipBreakdownAvailable\":false,\"pointInTime\":\"2026-03-31\",\"annualIncrement\":false}",
        "restore": "node --import tsx .claude/scripts/themes/ingest-energy-emissions.mjs --write-local"
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
    "conversionFactor": 0.001,
    "decimalPlaces": 1,
    "displayUnit": "MW"
  },
  "isActive": true,
  "surveyScope": "not-applicable",
  "surveyScopeReason": "再エネ特措法に基づく認定・買取開始済み設備の行政公表集計であり、標本調査ではない。"
};
