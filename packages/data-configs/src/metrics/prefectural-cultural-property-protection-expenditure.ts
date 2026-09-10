import type { MetricConfig } from '../types';

export const prefecturalCulturalPropertyProtectionExpenditure: MetricConfig = {
  "key": "prefectural-cultural-property-protection-expenditure",
  "title": "都道府県の文化財保護経費",
  "subtitle": "2024年度決算・国庫財源込み",
  "description": "都道府県の文化財保護経費を47都道府県で比較します。都道府県の2024年度決算額で、国支出金を財源とした事業を含みます。国指定文化財等保存・活用事業、地方指定文化財保存・活用、保護管理等を含みます。県庁の経費であり、市町村や民間を含む県内全体の文化財支出ではありません。指定県文化財だけに対する経費ではなく、指定件数との単純な1件当たり額にはしません。",
  "note": "都道府県の2024年度決算額で、国支出金を財源とした事業を含みます。国指定文化財等保存・活用事業、地方指定文化財保存・活用、保護管理等を含みます。県庁の経費であり、市町村や民間を含む県内全体の文化財支出ではありません。指定県文化財だけに対する経費ではなく、指定件数との単純な1件当たり額にはしません。",
  "unit": "千円",
  "category": "educationsports",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "文化庁 令和7年度地方における文化行政及び令和6年度文化関係経費の状況",
    "url": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf",
    "config": {
      "source": {
        "name": "文化庁 令和7年度地方における文化行政及び令和6年度文化関係経費の状況",
        "url": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/",
        "url": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf",
        "table": "印刷62–63頁/PDF66–67頁 令和6年度都道府県集計表 合計",
        "valueColumn": "印刷62–63頁/PDF66–67頁 令和6年度都道府県集計表 合計",
        "dataYear": "2024年度",
        "accessedAt": "2026-09-10",
        "extraction": "固定SHAの公式原典を読み、都道府県名・県数47・重複・欠測・非負値を検査。列の母集団を保持して各県値を抽出。",
        "verification": "{\"prefectures\":47,\"fundingIdentities\":47,\"sourceNationalMatches\":3} 全国計:38718774",
        "restore": "node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-perinatal-heritage.mjs --write-local",
        "pdfUrl": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf",
        "pdfPage": 66
      }
    }
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2024,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "isActive": true
};
