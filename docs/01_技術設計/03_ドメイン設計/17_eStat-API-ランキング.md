---
title: eStat-API ランキング変換サブドメイン
created: 2025-10-30
updated: 2025-10-30
tags:
  - eStat-API
  - ドメイン設計
  - サブドメイン
  - R2
---

# eStat-API ランキング変換サブドメイン設計

## 概要

本サブドメインは、e-Stat API（StatsData）から取得した応答を、Ranking 機能が直接利用可能なランキング形式（値のみ＋最小限 metadata）へ正規化し、R2 ストレージへ保存する役割を担います。順位やパーセンタイルの計算は行いません（Ranking 機能の責務）。

— 境界の要点 —
- 本サブドメイン: 取得 → 正規化（値のみ）→ 統計量付与（min/max/mean/median）→ R2 保存
- Ranking 機能: D1 の視覚化設定に基づく順位/パーセンタイル計算と表示

## 目次

1. [責務と主要概念](#責務と主要概念)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [I/O 仕様](#io-仕様)
4. [データ構造](#データ構造)
5. [R2 保存仕様](#r2-保存仕様)
6. [エラー/リトライ/レート制御](#エラーリトライレート制御)
7. [パフォーマンス/バルク処理](#パフォーマンスバルク処理)
8. [セキュリティ/運用](#セキュリティ運用)
9. [変更影響](#変更影響)

## 責務と主要概念

### 責務
- e-Stat API 応答（StatsData）を内部共通形式に変換
- ランキング形式（値のみ: `areaCode`, `areaName`, `value`）へ正規化
- 最小限の統計量（`min`, `max`, `mean`, `median`）の計算と付与
- R2 への保存（冪等・上書き方針の遵守）

### 非責務
- 順位計算、パーセンタイル算出、可視化設定管理（Ranking 機能の責務）

### 主要概念
- `estat_api_metadata`: ランキングキーと e-Stat パラメータの対応（構造は estat-api ドメインが定義、書き込みは Ranking 機能）
- `RankingDataPoint`: 値のみの最小単位（`areaCode`, `areaName`, `value`）

## アーキテクチャ設計

```
src/features/estat-api/
├── fetcher/                 # e-Stat API 呼び出し
├── formatter/               # 値のみランキング形式へ正規化（本サブドメインの中核）
├── exporter/                # R2 保存
└── metadata/                # estat_api_metadata 取り扱い
```

— コンポーネント —
- fetcher: StatsData の取得、基本検証、ページング
- formatter: 値抽出/単位整形/NULL・欠損処理/地域コード・名前解決
- exporter: R2 キー生成、冪等保存、上書きポリシー遵守
- metadata: `rankingKey → {stats_data_id, cd_cat01...}` マッピング取得

## I/O 仕様

入力
- `estat_api_metadata` から得られる実行パラメータ
- e-Stat StatsData 応答（JSON）

出力
- R2 に保存するランキング JSON（値のみ）
- 付随する `statistics` と `metadata`

## データ構造

### JSON（R2 へ保存）

```json
{
  "values": [
    { "areaCode": "13000", "areaName": "東京都", "value": 6439.3 },
    { "areaCode": "27000", "areaName": "大阪府", "value": 4646.5 }
  ],
  "statistics": { "min": 64.5, "max": 6439.3, "mean": 338.7, "median": 124.5 },
  "metadata": {
    "rankingKey": "population_density",
    "timeCode": "2023",
    "unit": "人/km²",
    "dataSourceId": "estat"
  }
}
```

### 型（抜粋 / TypeScript）

```ts
export interface RankingDataPointValueOnly {
  areaCode: string;
  areaName: string;
  value: number;
}

export interface RankingExportPayload {
  values: RankingDataPointValueOnly[];
  statistics: { min: number; max: number; mean: number; median: number };
  metadata: { rankingKey: string; timeCode: string; unit: string; dataSourceId: "estat" };
}
```

## R2 保存仕様

- キー設計: `ranking/{areaType}/{rankingKey}/{timeCode}.json`
  - 例: `ranking/prefecture/population_density/2023.json`
- 保存方針:
  - 同一キーは上書き（冪等）
  - 値は「値のみ」（順位・パーセンタイルは含めない）
  - `metadata.unit` は e-Stat に準拠し正規化

— 互換（旧構造）—
- 旧: `ranking/{rankingKey}/{areaType}/{timeCode}.json`
- 併存期間中は新構造を優先

## エラー/リトライ/レート制御

- レート制限: e-Stat API の制限に準拠、指数バックオフ
- リトライ: ネットワーク/一時エラーのみ再試行
- データ品質: 必須フィールド欠落時はスキップ＋警告ログ

## パフォーマンス/バルク処理

- ページング取得とストリーム処理でメモリ使用を抑制
- まとめ書き込み（バッチ）で R2 PUT の回数を削減

## セキュリティ/運用

- 管理者実行に限定（鍵/権限）
- dry-run サポート（R2 書き込み無効化）
- 監査ログ（保存件数、スキップ件数、警告）

## 変更影響

- Ranking 機能/DB スキーマに影響なし（読み取り先とキー規約は共有）


