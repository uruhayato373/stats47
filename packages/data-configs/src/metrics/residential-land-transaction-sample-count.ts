import type { MetricConfig } from '../types';

export const residentialLandTransactionSampleCount: MetricConfig = {
  "key": "residential-land-transaction-sample-count",
  "title": "住宅地の取引価格標本数（100〜300㎡未満）",
  "unit": "件",
  "category": "construction",
  "note": "公表面積100㎡以上300㎡未満。用途・面積帯以外の立地・接道・形状等は統制していない。2025年中の回答された取引標本。種類=宅地(土地)、地域=住宅地、取引価格01のみ。成約価格02を含まず、全取引件数・全物件相場を示さない。取引面積・価格は公表時に丸められる。総額÷面積の再計算はしない。2025年中の取引と1月1日の公示価格を時点調整していないため、価格差率や割安・割高の判定には使わない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "国土交通省 不動産情報ライブラリ 不動産取引価格情報",
        "url": "https://www.reinfolib.mlit.go.jp/",
        "license": "PDL1.0"
      },
      "description": "公式Webで47県を順に選択し、価格情報=取引価格のみ、種類=宅地(土地)、期間=2025年第1～第4四半期、一覧のCSVダウンロード。CP932 CSVの種類=宅地(土地)、地域=住宅地、公表面積100以上300未満、正の有限な取引価格（㎡単価）を採用。上限表記・欠測を別理由で除外。匿名化後の同一行は同一取引と断定せず保持。対象行の件数を集計。",
      "provenance": {
        "publicationIndexUrl": "https://www.reinfolib.mlit.go.jp/",
        "url": "https://www.reinfolib.mlit.go.jp/realEstatePrices/",
        "table": "2025年 47都道府県CSV 宅地(土地)",
        "valueColumn": "取引価格（㎡単価）",
        "dataYear": "2025年中",
        "accessedAt": "2026-09-10",
        "extraction": "公式Webで47県を順に選択し、価格情報=取引価格のみ、種類=宅地(土地)、期間=2025年第1～第4四半期、一覧のCSVダウンロード。CP932 CSVの種類=宅地(土地)、地域=住宅地、公表面積100以上300未満、正の有限な取引価格（㎡単価）を採用。上限表記・欠測を別理由で除外。匿名化後の同一行は同一取引と断定せず保持。対象行の件数を集計。",
        "verification": "47県CSVの81,347行とUI件数が全47県一致。条件内37,808行。画面万円とCSV円の20行40数値一致。匿名化一致138行を保持。",
        "restore": "公開Web realEstatePrices/ で記載条件を再設定し47県CSVを保存。download-prefectures.mjs と source-manifest.json に正式ファイル名・SHA・条件を固定。aggregate.py → prepare-proposal.py → build-config-proposals.py。blob URLは一時的で恒久直リンクではない。",
        "acquisitionLimitation": "url は正規ダウンロード画面。CSVはWeb生成の一時 blob URLで、恒久ファイル直リンクは提供を確認できていない。公開Web操作による再取得条件とraw SHAを保持する。"
      },
      "profileKey": "property-price-distribution",
      "sourceManifestSha256": "172eeb706c9bd080567ca828a38b6dbf05b50444da69fe5e6e5bb61cc3bdf639",
      "dataset": "transactions",
      "statistic": "count"
    },
    "displayName": "国土交通省 不動産情報ライブラリ 不動産取引価格情報",
    "url": "https://www.reinfolib.mlit.go.jp/"
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
