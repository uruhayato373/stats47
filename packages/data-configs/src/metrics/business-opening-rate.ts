import type { MetricConfig } from '../types';

export const businessOpeningRate: MetricConfig = {
  "key": "business-opening-rate",
  "title": "開業率",
  "subtitle": "雇用保険適用事業所",
  "description": "当該年度の雇用保険の保険関係新規成立事業所数を前年度末の適用事業所数で割り、100を掛けた割合。",
  "note": "企業単位の起業・廃業件数ではありません。雇用者のいない事業者は把握できません。保険関係の成立・消滅を開業・廃業とみなします。月報は業務統計値のため変動し得ます。分母は前年度末の適用事業所数で、年度月平均を用いません。",
  "unit": "%",
  "category": "economy",
  "source": {
    "kind": "external",
    "fetcherKey": "calculated",
    "displayName": "厚生労働省「雇用保険事業年報・月報」",
    "url": "https://www.e-stat.go.jp/stat-search/files?toukei=00450223",
    "config": {
      "source": {
        "name": "厚生労働省「雇用保険事業年報・月報」",
        "url": "https://www.e-stat.go.jp/stat-search/files?toukei=00450223"
      },
      "provenance": {
        "publicationIndexUrl": "https://www.e-stat.go.jp/stat-search/files?toukei=00450223",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040366800",
        "table": "雇用保険事業年報 第25表（１） 都道府県労働局別適用状況〔事業所関係〕 ＋ 同年3月月報 第1表",
        "valueColumn": "年報B8:B54 ÷ 同年3月月報D7:D53 × 100",
        "dataYear": "2022〜2024年度",
        "accessedAt": "2026-09-10",
        "extraction": "専用ingesterの原典URL・SHA256一覧から年報と同年3月月報を復元。年度・列見出し・47県順序をassertし、年報B/C列と月報D列を対応づける。率は100×分子÷分母を再計算。",
        "verification": "各年度の新規成立数・消滅数・基準事業所数の47県合算が公表全国計と完全一致。全国率を白書の小数1桁値と照合。2022年度の白書掲載11県と上位順位を照合。欠測・重複なし。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-business-demography.mjs --write-local"
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
  "calculation": {
    "isCalculated": true,
    "type": "ratio",
    "scaleFactor": 100,
    "numeratorKey": "business-opening-establishments",
    "denominatorKey": "business-opening-base-establishments",
    "description": "年度内の新規成立・消滅数を、同じ年度キーに対応づけた前年度末事業所数で除す。"
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "雇用保険の保険関係に関する行政業務記録",
  "isActive": true
};
