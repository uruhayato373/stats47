import type { MetricConfig } from '../types';

export const pm25GeneralStationComplianceRate: MetricConfig = {
  "key": "pm25-general-station-compliance-rate",
  "title": "PM2.5の環境基準達成率",
  "subtitle": "一般環境大気測定局",
  "description": "有効な一般環境大気測定局に占める、PM2.5の長期基準と短期基準をともに達成した局の割合です。",
  "note": "自動車排出ガス測定局を含みません。測定局単位の指標であり、住民の曝露割合や県内全域の大気状態を示すものではありません。環境基準は年平均15μg/m³以下かつ日平均値の年間98パーセンタイル値35μg/m³以下。測定局の設置状況と有効測定局数は年度により変わります。",
  "unit": "%",
  "category": "safetyenvironment",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "環境省「大気汚染状況」",
    "url": "https://www.env.go.jp/air/osen/index.html",
    "config": {
      "source": {
        "name": "環境省「令和6年度大気汚染状況」",
        "url": "https://www.env.go.jp/air/osen/index.html"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.env.go.jp/air/osen/index.html",
        "pdfUrl": "https://www.env.go.jp/content/000406532.pdf",
        "pdfPage": 31,
        "table": "参考2 微小粒子状物質（PM2.5）の都道府県別の環境基準達成状況",
        "valueColumn": "一般局・令和4〜6年度・達成局数÷有効測定局数×100",
        "dataYear": "2022〜2024年度",
        "accessedAt": "2026-09-10",
        "extraction": "SHA256=a04e612926da645e56cfffc06b145c2366e5965a0e7d163c4531f66593a1ef53 のPDFをpdftotext -layoutで抽出。参考2の一般局12列を県名で47県に対応させる。率は100×達成局数÷有効測定局数で計算。",
        "verification": "各年度47県、全3年度の総局数・有効局数・達成局数の県合計が公表全国値と一致。原表の全141丸め率と分子/分母からの計算値が0.05ポイント以内で一致。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-air-quality.mjs --write-local"
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2022,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "一般環境大気測定局による常時監視結果",
  "isActive": true
};
