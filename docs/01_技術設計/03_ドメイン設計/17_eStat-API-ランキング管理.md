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
- `estat_ranking_mappings`: e-Stat パラメータ（`stats_data_id`, `cat01`, `item_code`等）とランキング項目のマッピングテーブル（CSV ベース、`isRanking`フラグでランキング変換対象を指定）
- `RankingDataPoint`: 値のみの最小単位（`areaCode`, `areaName`, `value`）
- `isRanking`: ランキング変換対象フラグ（`true`の場合、R2 にランキング形式で保存）

## アーキテクチャ設計

```
src/features/estat-api/
├── ranking-mappings/        # ランキングマッピング管理（本サブドメインの中核）
│   ├── repositories/        # estat_ranking_mappings テーブル操作
│   ├── services/           # CSV インポート、ランキング変換
│   ├── actions/            # Server Actions（管理画面用）
│   └── types/              # 型定義
├── fetcher/                 # e-Stat API 呼び出し
├── formatter/               # 値のみランキング形式へ正規化
└── metadata/                # estat_api_metadata 取り扱い
```

— コンポーネント —

- ranking-mappings: CSV ベースのマッピングデータ管理、ランキング変換実行
  - repositories: `estat_ranking_mappings`テーブルの CRUD 操作、`isRanking`フィルタ、バルクアップサート
  - services: CSV パース・インポート、e-Stat データ → ランキング形式変換、統計量計算
  - actions: 管理画面からの CSV インポート、`isRanking`更新、ランキング変換実行
- fetcher: StatsData の取得、基本検証、ページング
- formatter: 値抽出/単位整形/NULL・欠損処理/地域コード・名前解決
- metadata: `rankingKey → {stats_data_id, cd_cat01...}` マッピング取得

## I/O 仕様

入力

- `estat_ranking_mappings` テーブル（`isRanking=true`の項目）
- CSV ファイル（`data/prefectures.csv`形式）: マッピングデータのインポート元
- e-Stat StatsData 応答（JSON）: ランキング変換対象データ

出力

- R2 に保存するランキング JSON（値のみ）
- 付随する `statistics` と `metadata`

### CSV ファイル形式

```csv
stats_data_id,cat01,item_name,item_code,unit,dividing_value,new_unit,ascending
0000010204,#D0110101,財政力指数（都道府県財政）,financial-power-index,‐,,,False
```

- `stats_data_id`: e-Stat 統計表 ID
- `cat01`: e-Stat 分類コード
- `item_name`: 項目名（日本語）
- `item_code`: 項目コード（`ranking_items.ranking_key`とは別管理）
- `unit`: 単位
- `dividing_value`: 除算値（未使用）
- `new_unit`: 新単位（未使用）
- `ascending`: 昇順フラグ（未使用）

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

### データベーススキーマ

```sql
CREATE TABLE IF NOT EXISTS estat_ranking_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  dividing_value TEXT,
  new_unit TEXT,
  ascending BOOLEAN DEFAULT 0,
  is_ranking BOOLEAN DEFAULT 0,  -- ランキング変換対象フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, cat01, item_code)
);
```

— カラム説明 —

- `stats_data_id`: e-Stat 統計表 ID
- `cat01`: e-Stat 分類コード（`cdCat01`パラメータに対応）
- `item_name`: 項目名（日本語）
- `item_code`: 項目コード（`ranking_items.ranking_key`とは別管理）
- `unit`: 単位
- `dividing_value`: 除算値（CSV からインポート、未使用）
- `new_unit`: 新単位（CSV からインポート、未使用）
- `ascending`: 昇順フラグ（CSV からインポート、未使用）
- `is_ranking`: ランキング変換対象フラグ（`true`の場合、ランキング変換を実行）

### 型（抜粋 / TypeScript）

```ts
export interface EstatRankingMapping {
  id: number;
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string | null;
  dividing_value: string | null;
  new_unit: string | null;
  ascending: boolean;
  is_ranking: boolean;
  created_at: string;
  updated_at: string;
}

export interface RankingDataPointValueOnly {
  areaCode: string;
  areaName: string;
  value: number;
}

export interface RankingExportPayload {
  values: RankingDataPointValueOnly[];
  statistics: { min: number; max: number; mean: number; median: number };
  metadata: {
    rankingKey: string; // item_code を使用
    timeCode: string;
    unit: string;
    dataSourceId: "estat";
  };
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

### 管理画面からの手動実行

- CSV インポート: `data/prefectures.csv`ファイルをアップロードして`estat_ranking_mappings`テーブルにインポート
- `isRanking`フラグ編集: 管理画面から個別にランキング変換対象を指定
- ランキング変換実行: `isRanking=true`の項目について、e-Stat API からデータを取得し、ランキング形式に変換して R2 に保存
  - 実行方法: 管理画面（`/admin/dev-tools/estat-api/ranking-mappings`）から手動実行
  - バッチ処理: 選択した項目または`isRanking=true`の全項目を一括処理
  - 進捗表示: 処理件数、成功/失敗件数を表示

## 変更影響

- Ranking 機能/DB スキーマに影響なし（読み取り先とキー規約は共有）
- 新規テーブル: `estat_ranking_mappings`を追加（CSV ベースのマッピングデータ管理）
- 新規機能: CSV インポート、ランキング変換実行機能を追加

## 実装フロー

### 1. CSV インポート

1. `data/prefectures.csv`ファイルをアップロード
2. CSV をパースして`estat_ranking_mappings`テーブルにバルクアップサート
3. `isRanking=false`で初期化（デフォルト）

### 2. ランキング変換対象の指定

1. 管理画面で`isRanking=true`に設定する項目を選択
2. `updateIsRankingAction`でフラグを更新

### 3. ランキング変換実行

1. `isRanking=true`の項目を取得
2. 各項目について e-Stat API からデータ取得（`fetchStatsData`）
3. `formatStatsData`でデータ整形
4. `convertStatsDataToRankingFormat`でランキング形式に変換
   - `areaCode`, `areaName`, `value`のみ抽出
   - 統計量（min/max/mean/median）計算
5. `saveRankingToR2`で R2 に保存
   - キー: `ranking/{areaType}/{item_code}/{timeCode}.json`
   - 形式: `RankingExportPayload`
