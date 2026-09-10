import type { MetricConfig } from '../types';

export const regionalIndustryCo2EmissionsEstimate: MetricConfig = {
  "key": "regional-industry-co2-emissions-estimate",
  "title": "産業部門のCO₂排出量推計",
  "subtitle": "製造業・建設業・鉱業・農林水産業",
  "description": "産業部門のCO₂排出量推計を47都道府県で比較します。",
  "note": "2023年度末の1,741市区町村を都道府県に集計した環境省の標準的手法による参考推計（2026年3月版、原データは2026年1月末時点）。全国・県の炭素排出量を製造品出荷額・従業者・世帯・自動車保有台数等で按分したCO₂で、直接実測値や全温室効果ガスではありません。電力・熱配分後のエネルギー起源CO₂と一般廃棄物焼却CO₂を対象とし、森林吸収、一般廃棄物以外の非エネルギー起源分、運輸の航空を含みません。原推計は製造品出荷額の秘匿値をゼロとしているため、県別エネルギー消費統計の県排出量より小さくなる場合があります。全国値も市区町村推計の積上げで、国の温室効果ガス排出インベントリと一致するとは限りません。過年度値の遡及修正があるため公開版を混在させません。",
  "unit": "千t-CO₂",
  "category": "safetyenvironment",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "環境省 部門別CO₂排出量の現況推計",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx",
    "config": {
      "source": {
        "name": "環境省 部門別CO₂排出量の現況推計",
        "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
      },
      "provenance": {
        "publicationIndexUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
        "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx",
        "pdfUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/suikei-1.pdf",
        "table": "2023_一覧表!H3:H1743 をA列の県コードで集計",
        "valueColumn": "2023_一覧表!H3:H1743 をA列の県コードで集計",
        "dataYear": "2023年度（2026年3月公表版）",
        "accessedAt": "2026-09-10",
        "extraction": "公式SHA固定Excelの1,741市区町村を一意コードで確認し県コード別集計。指定都市は市行だけ、東京都は23区を個別に含み特別区合計を追加しない。原表の小数を保持。",
        "verification": "{\"prefectures\":47,\"municipalities\":1741,\"uniqueMunicipalities\":1741,\"tokyoWards\":23,\"designatedCityWardRows\":0,\"missing\":0,\"sourceSubtotalIdentities\":6964,\"prefectureRoundedMatches\":282,\"nationalRoundedMatches\":6,\"allocationEstimate\":true,\"sourceDataCutoff\":\"2026-01-31\",\"year\":\"2023\"}",
        "restore": "node --import tsx .claude/scripts/themes/ingest-energy-emissions.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2023,
    "to": 2023
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true,
  "surveyScope": "not-applicable",
  "surveyScopeReason": "複数の公表統計を用いた環境省のモデル推計・加工集計であり、独立した標本調査ではない。"
};
